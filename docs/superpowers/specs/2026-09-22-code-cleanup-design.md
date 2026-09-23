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
| Profile | 2 | 0 | page.tsx 601 lines | 1 | Done[^profile-branch] |
| Reviews | 1 | 1 | page.tsx 546 lines | 1 | Done |
| Groups → core | 6 | 1 (services.ts 697 lines, 8 functions, heavy duplicated Prisma `include` blocks — real DRY payoff from a repository layer) | services.ts 697 lines | 1 | In progress |
| Groups → Member Tasks | 2 | 1 | member-tasks/services.ts 221 lines | 1 | Not started |
| Groups → Trips (nested `/api/groups/[groupId]/trips`) | 2 | 2 | trips/services.ts 118, trips/[tripId]/services.ts 204 | 1 | Not started |
| Trips (core, top-level `/api/trips`) | subset of 11 | subset of 5 | — | 1 | Not started |
| Trips → Activities | subset | subset | activities/services.ts 373 | 1 | Not started |
| Trips → Budget | subset | subset | — | 1 | Not started |
| Trips → Expenses/Payments | subset | subset | expenses/services.ts 1028, ExpenseForm 1002, Expenses page 1275 | 1 | Not started |
| Dashboard | — | 0 | 1853 across 10 files (already reasonably decomposed — verify only) | 2 | Deferred |
| Admin | 6 | 0 | 484 lines | 2 | Deferred |
| Notifications | 4 | 1 | 393 lines | 2 | Deferred |
| Upload | 1 | 0 | 98 lines | 2 | Deferred |
| Config / Stats / User | 3 | 0 | small | 2 | Deferred |
| Sync (test-data seeding) | 1 | — | testDataService.ts 1266 — internal tool | 2 | Deferred, low priority |
| Guest* page components | — | — | 5 files, ~700 lines total | 2 | Deferred |
| Landing/About/FAQ/HowTo | — | — | — | 2 | Deferred, low priority |
| v1 Gateway | 1 | 0 | 94 lines | — | **Excluded — removed in security pass, not migrated** |

[^profile-branch]: Profile's PR (#121) was merged into the `refactor/foundation-infra` branch instead of `dev` — a timing mixup, since Foundation's own PR (#119) had already merged into `dev` by the time #121 was merged. Profile's 3 commits are fully implemented and reviewed but are not yet actually in `dev`. A follow-up PR (`refactor/foundation-infra` → `dev`) is open to land them: https://github.com/beefysalad/Wanderly/pull/124 — merge that before starting any work that assumes Profile's `src/app/api/profile/*` layout is on `dev`.

**Groups decomposition note:** the original single "Groups" row (10 routes, 4 services) turned out, once actually read, to bundle three independently-migratable sub-units — split above into Groups → core, Groups → Member Tasks, and Groups → Trips (a nested `/api/groups/[groupId]/trips` resource, distinct from the top-level `/api/trips` used by the standalone Trip pages — the two look similar and are easy to conflate; check the route path, not just the word "trips"). Row counts still sum to the original 10 routes / 4 services. Groups → core is being migrated now; the other two Groups sub-units are queued right after it, before moving on to top-level Trips.

Pass 1 order (confirmed): **Profile → Reviews → Groups (core → Member Tasks → nested Trips) → Trips-core → Activities → Budget → Expenses/Payments.**

Repo hygiene (dead `src/components`/`src/lib` dirs, stray root files, doc consolidation) is not feature-scoped — it's a standalone quick task done once, not per-pass.

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
