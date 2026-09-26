# Code Cleanup: Service/Repository Architecture & Structural Debt

Date: 2026-09-22
Status: Approved — ready for implementation planning

## Background

An audit of the codebase (see conversation history / `CLAUDE.md`) found the app functionally working but structurally inconsistent — the result of AI-assisted development with no enforced conventions. `CLAUDE.md` (added in a prior PR) now documents the *target* conventions: thin route handlers, a service/repository split for backend logic, Zod validation on every route, and a ~300-line ceiling on components before splitting.

This spec covers **cleaning up the code that already exists** to match those conventions — explicitly out of scope: the three known security issues (shared admin password, `/api/v1/gateway` obfuscation proxy, guest-code validation gaps). Those get their own security-focused pass later and are not touched here.

This is explicitly a multi-pass effort. Pass 1 (this spec) covers the features ranked simplest → most complex. Pass 2+ (also inventoried below) covers everything else, so later work doesn't require re-discovering scope from scratch.

## Goals

- Every migrated feature has a `repository.ts` (only file touching Prisma), a `services.ts` that imports only the repository, and `route.ts` files that validate input with Zod and use `context.params`.
- Oversized components (>~300 lines) are split into a local `components/` subfolder or extracted hooks.
- `console.*` calls in migrated files are replaced with the existing `logger`.
- A real test suite exists (Vitest), focused on service-layer business logic.
- CI runs lint + build + test on every PR.
- The feature inventory below is kept current as a durable tracking artifact across passes.

## Non-Goals

- Fixing the admin-password auth, the gateway proxy, or guest-code validation (separate security pass).
- Migrating every feature in one PR — this ships as one PR per feature (vertical slices), per Pass 1 ordering.
- Full integration/DB test coverage — repository-layer tests are deferred (see Testing Strategy).
- Any behavior change beyond what falls out of the refactor itself (no new features, no UX changes).

## Feature Inventory & Pass Tracking

Update the "Status" column as PRs land. This table is the source of truth for what's been migrated.

| Feature | API routes | Services today | Largest files | Pass | Status |
|---|---|---|---|---|---|
| Profile | 2 | 0 | page.tsx 601 lines | 1 | Done |
| Reviews | 1 | 1 | page.tsx 546 lines | 1 | Done |
| Groups → core | 6 | 1 (services.ts 697 lines, 8 functions, heavy duplicated Prisma `include` blocks — real DRY payoff from a repository layer) | services.ts 697 lines | 1 | Done |
| Groups → Member Tasks | 2 | 1 | member-tasks/services.ts 221 lines | 1 | Done |
| Groups → Trips (nested `/api/groups/[groupId]/trips`) | 2 | 2 | trips/services.ts 118, trips/[tripId]/services.ts 204 | 1 | Done (two services.ts consolidated into one) |
| Trips → shared `verifyTripAccess` (`src/app/api/trips/access.ts`) | — | 7 private copies across 6 services | — | 1 | Done (Budgets adopts it; each remaining unit swaps its copy on migration) |
| Trips → Budgets | 2 | 1 | budgets/services.ts 200 | 1 | Done |
| Trips → Activities | subset | 1 | activities/services.ts 373 | 1 | Done |
| Trips → Payment-logs | subset | 1 | payment-logs/services.ts 278 | 1 | Done |
| Trips → ICS export | 1 | 0 | export/ics/route.ts 324 | 1 | Done |
| Trips → Expenses | subset | 1 | expenses/services.ts 1028, transformers 158, ExpenseForm 1002, Expenses page 1275 | 1 | API Done; ExpenseForm split Done (1002 → 175-line index + steps/hooks/components); Expenses page (1275 lines) split still outstanding |
| Trips → Expense Payments | subset | 1 | payments/services.ts 358 (`confirm-payment` was merged into `payments/confirm`, PR #157) | 1 | Done |
| Dashboard | — | 0 | 1853 across 10 files; only OnboardingWizard (651) and index (330) exceed the ceiling | 2 | Verified — see Component backlog |
| Admin | 6 | 0 | 484 lines | 2 | Done in 3 PRs (config + verify-password + shared `assertAdmin` guard; users; db stats/maintenance). The shared-password gate itself is untouched: security pass |
| Notifications | 4 | 1 | 393 lines | 2 | Done (the unused POST /api/notifications, which let any user create a notification for any user, was removed) |
| Upload | 1 | 0 | 98 lines | 2 | Done (folder restricted to the two folders the app uses) |
| Config / Stats / User | 3 | 0 | small | 2 | Done (admin-password gate on whats-new POST left for the security pass) |
| Sync (user sync + sample-data seeding) | 1 | 2 | testDataService.ts 1266 → 220 lines + declarative `sampleTripData.ts` | 2 | Done. The seeding output was diffed call-for-call against the old implementation (78 identical Prisma calls) before the old code was removed |
| Guest* page components | — | — | 5 files, largest 255 lines | 2 | Checked — all under the 300-line ceiling, no action needed |
| Landing/About/FAQ/HowTo | — | — | — | 2 | Deferred, low priority |
| v1 Gateway | 1 | 0 | 94 lines | — | Removed in the security pass |

**Groups decomposition note:** the original single "Groups" row (10 routes, 4 services) turned out, once actually read, to bundle three independently-migratable sub-units — split above into Groups → core, Groups → Member Tasks, and Groups → Trips (a nested `/api/groups/[groupId]/trips` resource, distinct from the top-level `/api/trips` used by the standalone Trip pages — the two look similar and are easy to conflate; check the route path, not just the word "trips"). Row counts still sum to the original 10 routes / 4 services. All three Groups sub-units (core, Member Tasks, nested Trips) are done; top-level `/api/trips` has no standalone "core" unit (it was a phantom row); the real remaining units are the trip-scoped features under `/api/trips/[tripId]/` listed above.

**Component backlog (files still over the ~300-line ceiling, found by a repo-wide scan).** Pass 1 only covered ExpenseForm and the Expenses page. **Done: Trip/index (817 → ~150; hooks + components + tested cache helpers) and Modal/ActivityModal + Modal/ActivityDetailModal, which turned out to be unreachable dead code (only referenced by modal blocks in Trip that could never open) and were deleted; `activityAddZod.ts` stays because the add/edit pages use it.** **Done: Dashboard/OnboardingWizard (651 → ~75; six step components, hook, tested bio/profile builders).** Remaining, in descending size: Trip/TravelSchedule 612, admin/whats-new page 605, activities/add page 584, Modal/ExpenseDetailModal 518, ExpenseDetail 480, activities/[id]/edit page 483, FAQ 443, Group 402, ActivityDetail 372, admin/database 367, ExpenseList 365, HowTo 356, ActivityDetailModal 346, admin/config 332, admin/users 328, TravelDayOverview 305. The admin pages fall under the security pass; FAQ/HowTo are mostly static content.

Pass 1 order (confirmed): **Profile → Reviews → Groups (core → Member Tasks → nested Trips) → Trips-core → Activities → Budget → Expenses/Payments.**

Repo hygiene (dead `src/components`/`src/lib` dirs, stray root files, doc consolidation) is not feature-scoped — it's a standalone quick task done once, not per-pass.

## Handoff Notes (lessons and open follow-ups from Pass 1 so far)

**How each feature was shipped:** one plan doc in `docs/superpowers/plans/`, executed task-by-task (implementer → independent task review → final whole-branch review), one PR per feature/sub-unit. Plans for Foundation, Profile, Reviews, Groups core, Groups Member Tasks, and Groups nested Trips are in that folder and are the best templates for the next ones.

**Patterns worth reusing:**
- `src/app/api/groups/repository.ts` already exports `findGroupMembership`, `findGroupOwnership`, `listGroupMembersForNotify`. Any feature under `/api/groups/**` or `/api/trips/**` that checks membership or fans out notifications should import these rather than re-querying Prisma (Member Tasks and nested Trips both do).
- `withAuth`/`withOptionalAuth` forward Next's route params: declare a third handler argument typed `RouteContext<{ groupId: string; ... }>` and `await params`. Existing 2-argument handlers keep working.
- When a feature has two `services.ts` files for the same resource (nested Trips did), consolidate into one repository/services/schemas at the parent folder rather than migrating both in place.

**Recurring gotchas caught in review:**
- `z.coerce.date()` turns `null` into 1970-01-01. Guard date fields (`z.union([z.string().min(1), z.number()]).pipe(z.coerce.date())`, or put `z.null()` first in a union) — this slipped into nested Trips and Member Tasks needed the same care.
- Component splits are where regressions hide (a dropped `setUploadError(null)` slipped through in Profile). Diff every `useState`/handler against the original, not just the JSX.
- Plan prose miscounts tests more than once ("12 vs 13", "5 vs 6") — trust the code block, not the sentence.
- No reachable database/Firebase in the agent sandbox, so no live browser QA has happened for any migrated feature. Every PR says so; a human pass on `/profile`, `/reviews`, group create/join/leave, the Members page, and trip create/status-change/delete is still owed.

**Open follow-ups (not blocking, not yet done):**
- (Fixed in PR #133, once merged: a non-JSON request body now returns 400 instead of 500 for every migrated route, handled once in `lib/handle-api-error.ts`.)
- Any group member can PATCH/DELETE any Member Task (no creator/assignee restriction) — preserved as-is from the old code; decide whether that is intended.
- Expense payments: `expenses/[expenseId]/confirm-payment` (detail page) and `.../payments/confirm` (list hook) are two live, *different* flows — the first upserts the status and notifies the member; the second only updates an existing record and writes a payment log. Marking paid (default) also writes a payment log, and confirming writes another, so a confirmed payment can have two logs. Any member can also un-mark another member's payment. **Resolved in #157:** one route (`payments/confirm`) now upserts the status, notifies the member, and writes the payment log on confirm only (rejecting removes it); marking paid no longer logs. Any member un-marking another's payment was fixed earlier in the security pass.
- Security pass (admin password, gateway proxy, guest-code trust boundary): implemented on branch `security/revamp` (see `2026-09-25-security-pass-design.md`). Residual risk: the external socket server still authenticates guests by raw group code.

## Target Architecture (applies to every migrated feature)

```
src/app/api/<feature>/
  repository.ts   # only file importing @/lib/prisma; one fn per query/mutation, typed in/out, no business rules
  services.ts     # imports repository only; business rules, orchestration; throws typed errors
  route.ts        # parses context.params, validates body via schemas.ts, calls service, maps errors via handleApiError()
  schemas.ts       # Zod schemas for this feature's request bodies
  services.test.ts # Vitest, repository mocked
```

**New shared utilities** (added once, used everywhere):
- `lib/errors.ts` — `NotFoundError`, `ForbiddenError`, `ValidationError` (or similar small set), each carrying an HTTP status.
- `lib/handle-api-error.ts` — `handleApiError(error): NextResponse` — one place that maps thrown errors (typed or not) to a consistent JSON error shape and status code, replacing the current per-route ad hoc try/catch.

**Components:**
- Page `index.tsx` stays composition + data-fetching (hooks) only.
- Anything crossing ~300 lines gets split into a local `components/` subfolder (for JSX) or an extracted hook in `src/hooks` (for logic/state).
- Splits follow existing conventions already used elsewhere in the repo (e.g. `Dashboard/` already has 10 files) rather than inventing a new pattern.

**Definition of done, per feature:**
- [ ] `repository.ts` created; all Prisma calls for the feature moved there
- [ ] `services.ts` no longer imports `@/lib/prisma`
- [ ] Every `route.ts` in the feature validates its body with a Zod schema
- [ ] Every `route.ts` uses `context.params`, not manual `pathname` parsing
- [ ] Oversized components/pages split per the >300-line rule
- [ ] `console.*` replaced with `logger` in touched files
- [ ] `services.test.ts` covers the business-logic branches (guest rules, split/total calculations, error paths)
- [ ] Feature inventory table above updated to "Done"

## Testing Strategy

- **Runner**: Vitest, configured with the same `@/*` path alias as `tsconfig.json`.
- **Convention**: colocated tests (`services.test.ts` next to `services.ts`), not a separate `__tests__` tree.
- **Service tests** (priority): mock the repository module with `vi.mock`; test business rules and branches — no DB dependency, fast, deterministic.
- **Repository tests**: out of scope for Pass 1 — thin Prisma passthroughs; mocking the Prisma client wouldn't validate real DB behavior anyway. Real integration tests against a test database are a reasonable future addition, not required here.
- **Route tests**: a couple of smoke tests per feature covering the Zod-rejection path and `handleApiError()` mapping — not exhaustive per-endpoint coverage.

## CI

Add `.github/workflows/checks.yml`: runs on pull request, steps = install → `npm run lint` → `npm run build` → `npm run test`. This is new — no existing workflow gates PRs today (the two existing workflows only auto-create PRs between branches). Required-status-check enforcement on the `dev` branch protection rule is a repo-settings change outside this codebase; call it out to the user as a follow-up if they want it actually blocking.

## Rollout Mechanics

- One branch/PR per feature, based on `dev`, named `refactor/<feature>-service-repo` (e.g. `refactor/profile-service-repo`).
- Each PR is a complete vertical slice for that feature (repository + service + validation + component splits + tests) and should leave the app in a fully working state — no partial/broken intermediate states.
- No AI attribution in commits/PRs, per `CLAUDE.md`.
- After each PR merges, update the feature inventory table in this spec (or in `CLAUDE.md`, if the user prefers moving the table there permanently once Pass 1 completes).

## Risks / Open Questions

- Behavior drift during refactor: mitigated by service-layer tests written *before* the refactor lands (characterize existing behavior, then refactor against green tests) rather than after.
- Trips is large enough that "Trips-core / Activities / Budget / Expenses" may end up as 3-4 separate PRs rather than one — the implementation plan should treat them as separate tasks even though they're one row-family in the inventory.
- CI check is new; if `npm run build` currently fails or is slow (it runs `prisma generate && prisma migrate deploy && next build`), the checks workflow will need a test-database or mocked `migrate deploy` step — flagged for the implementation plan to verify, not resolved here.
