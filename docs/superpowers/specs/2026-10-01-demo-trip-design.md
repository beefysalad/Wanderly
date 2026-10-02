# Replace seeded sample group with a read-only demo trip

Implements issue #237. Written and carried through autonomously per explicit instruction — the user said to go through brainstorm → spec → plan → SDD implementation without pausing for approval at each stage, since they consider the feature straightforward. It turned out to have more moving parts than "just swap sample data for read-only data" (a schema migration, a production data-cleanup concern, and an architectural choice about how the demo is served) — documented below as rulings rather than questions, per that instruction.

## Problem

On first sync (`src/app/api/sync/syncService.ts`'s `seedIfNeeded`), every new account gets a real "Singapore Adventure 2024 (sample)" group and trip seeded into the database (`src/app/api/sync/testDataService.ts`, using fixed data from `sampleTripData.ts`).

- The fake members (Eleven, Mike, Steve) are real `User` rows **shared across every seeded account** — they show up as real members in every new user's sample group, and own real `GroupMember`/`Expense`/`ExpenseSplit` rows.
- Their names come from Stranger Things, a brand/IP risk for a public product.
- Sample rows pollute real data: counts, admin stats, and the `hasSeededTestData` flag plus special-case handling in `sync`, `admin/db`, and (per a prior migration, `20260927120000_restore_sample_member_accounts`) account-takeover defenses already had to be patched in once because these shared emails are guessable.
- Users have to find and delete the sample group themselves.

## Goals

- Stop writing any seed data to new accounts. New accounts start with zero groups.
- Offer an always-available, read-only demo trip that anyone (including logged-out visitors) can look at, linked from onboarding's "Look around" option and the dashboard's empty state.
- Remove `testDataService.ts`, `seedRepository.ts`, `sampleTripData.ts`, and the `hasSeededTestData` column entirely (including everything that reads or writes it).
- Demo content uses neutral, generic names — no real `User` rows shared across visitors.
- Ship a one-off script that identifies already-seeded production data for cleanup, dry-run by default.

## Non-goals

- Actually running the one-off cleanup script against production. It ships in this PR; running it for real against the live database is a separate, explicit action for the user to take after merge (per standing instruction: no destructive production data operations without a separate go-ahead at that moment).
- Applying the schema migration (`prisma migrate dev`/`deploy`). The migration SQL is hand-authored and committed; the user runs `npx prisma migrate dev` themselves (per standing CLAUDE.md instruction not to run that command).
- A demo for every feature (budgets, payment settlement flows, member management). One browsable trip (daily/schedule/calendar/expenses tabs, the same tabs a real guest already sees) is the full scope — matches what a prospective user actually needs to evaluate the product.
- Changing the real guest-access flow (`/guest/join`, group codes, guest tokens) in any way that affects real groups. The demo rides the exact same pipe without altering its behavior for real codes.

## Key decision: how the demo is actually served

The issue's proposal says "rendered from static data using the existing guest (read-only) views." I looked at what "the existing guest (read-only) views" actually are before committing to an approach, because the literal reading ("purely static, no backend") turns out not to fit how those views work.

**What I found:** `GuestTripComponent` (`src/app/components/pages/GuestTrip/index.tsx`) and the components it renders (`TripHero`, `TripTabs`) are prop-driven — they'd happily accept static data. But `TripTabContent`'s "expenses" tab renders `ExpensesComponent`, which does its own internal data-fetching (`useGroupAsGuest`, `useExpenses`, `usePaymentLogs` — three live API calls keyed by `groupId`/`tripId`), not props. A purely static front-end demo would need to either fork `ExpensesComponent` into a static-data variant (new, parallel code to maintain) or hide the expenses tab for the demo (a real gap — expense-splitting is a core part of what this product does, and a demo that can't show it undersells the product).

**Approaches considered:**

1. **Purely static front end, no backend record.** Build the demo entirely from TypeScript constants, feed them as props to `GuestShell`/`TripHero`/`TripTabs`, and fork a static-data version of the expenses tab. Pro: literally no new database row, zero write-path risk. Con: real new code to build and maintain (a second expenses renderer), and it never flexes the real guest API path it's supposedly "reusing."
2. **One real, permanent, publicly-known demo `Group`+`Trip` in the database, served through the existing group-code → guest-token → guest-view pipeline, unmodified.** A single row, created once, that anyone can reach via the exact same code `GuestJoin` already accepts — no new API routes, no forked components, no special-casing anywhere in the view layer. Expense "people" use `Expense.tempPaidBy`/`ExpenseSplit.tempName` (both already nullable-`userId` fields that exist precisely for "a display name with no `User` row attached" — the same mechanism `admin/users`'s account-deletion flow already relies on) instead of fake `User` rows, so there are still zero shared dummy users. **Recommended, and what this spec builds.**
3. **New, dedicated, unauthenticated API routes that mirror the guest endpoints but skip the token check.** Avoids a database row holding real relational data, but duplicates the guest API surface (a second `/api/demo/...` tree to keep in sync with `/api/groups/[groupId]/guest`, `/api/trips/[tripId]/expenses`, etc. as those evolve) for no real benefit over option 2.

Option 2 reuses more existing, already-tested code than either alternative, costs one additional always-present database row (a `Group`, a `Trip`, a handful of `Activity`/`Budget`/`Expense`/`ExpenseSplit` rows, and one dedicated non-login-capable "system" `User` row that owns the group — `Group.createdById` is a required, cascade-deleting foreign key, so the group needs a real owner), and is the only option whose demo content flexes the exact same code path real guests exercise. It is the one actually built below.

**Group membership note:** `GroupMember` rows are needed for the sidebar member display, but the only member is the system owner (so the demo shows "1 member" in places that surface a member count) — a cosmetic trade-off, accepted to avoid creating any additional `User` rows purely for display padding. Every expense "person" still shown as a payer or split member in the trip itself uses `tempPaidBy`/`tempName`, not this account, so the owner is invisible in the actual trip narrative; it's a schema-required anchor, not a character in the demo.

## Design

### 1. Schema migration — drop `User.hasSeededTestData`

`prisma/schema.prisma`: remove the `hasSeededTestData Boolean @default(false)` line from `model User`.

Hand-authored migration at `prisma/migrations/20261001100000_remove_has_seeded_test_data/migration.sql` (not generated by `prisma migrate dev`, per standing instruction):

```sql
-- AlterTable
ALTER TABLE "User" DROP COLUMN "hasSeededTestData";
```

This is a pure column drop — Postgres doesn't need the data moved anywhere first, since nothing downstream reads this column after this PR's code changes land. The user needs to run `npx prisma migrate dev` locally to apply it to their dev database; it applies to production automatically on the next production deploy via the existing `scripts/build.mjs` (`prisma migrate deploy`, gated on `VERCEL_ENV=production`).

### 2. Remove the seeding system

Delete entirely:
- `src/app/api/sync/testDataService.ts`
- `src/app/api/sync/testDataService.test.ts`
- `src/app/api/sync/seedRepository.ts`
- `src/app/api/sync/sampleTripData.ts`

`src/app/api/sync/syncService.ts`:
- Remove the `seedIfNeeded` function and its two call sites (both branches of `syncUserToDatabaseService`).
- Remove the `import { DUMMY_USERS } from "./sampleTripData"` import and the `DUMMY_USERS.some(...)` forbidden-email check in `createOrLinkUser`. Replace it with a small inline guard against the three legacy emails directly (not re-creating a shared constants file for three strings that exist only to protect against pre-existing rows during the transition):
  ```ts
  const LEGACY_SEEDED_EMAILS = new Set([
    "eleven.dummy@example.com",
    "mike.dummy@example.com",
    "steve.dummy@example.com",
  ]);
  ```
  Kept as defense-in-depth until the one-off cleanup script (section 5) has actually been run against production and these rows no longer exist — safe to delete afterward, noted as a follow-up in the PR description, not something this change needs to track further.
- Update `syncService.test.ts` to drop any seeding-related mocks/assertions.

### 3. The demo content itself — a one-time setup script

New file: `scripts/seed-demo-trip.ts` (run with `tsx`, matching the repo's existing `scripts/` convention). Idempotent (checks for the demo group by its fixed code before creating anything, so it's safe to run more than once) — this is an additive bootstrap script for a feature this PR ships, not the destructive cleanup from section 5, so it's safe for me to run against a local/dev database during implementation and verification. I will not run it against production; that's a manual step for the user after merge, documented in the PR body.

Fixed constants (new module, `src/app/api/groups/demoTrip.ts`, imported by both the seed script and, where needed, by code that must recognize the demo group e.g. for excluding it from anything "real-groups-only" in the future):

```ts
export const DEMO_GROUP_CODE = "SAMPLE";
export const DEMO_OWNER_EMAIL = "demo-owner@wanderly.app";
export const DEMO_OWNER_FIREBASE_ID = "system_demo_owner";
```

`DEMO_GROUP_CODE` uses only the charset `generateUniqueGroupCode` already draws from (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789` — excludes `0`, `O`, `I`, `1`; every letter in "SAMPLE" is in that set). It's fixed rather than randomly generated because the front-end links (section 4) need to know it at build time; nobody ever types it by hand, so memorability doesn't matter, only that it's stable.

The script creates, if `DEMO_GROUP_CODE` doesn't already resolve to a group:
- One `User` row (`DEMO_OWNER_EMAIL`, `firebaseId: DEMO_OWNER_FIREBASE_ID`, name `"Wanderly"`, `hasCompletedOnboarding: true`) — not a real account; nothing can log into it since no real Firebase UID maps to `DEMO_OWNER_FIREBASE_ID` (the same non-real-firebaseId pattern the old dummy users already used, applied to exactly one account instead of three).
- One `Group` (`name: "Weekend in Kyoto"`, `code: DEMO_GROUP_CODE`, `createdById`: the owner, emoji/colorScheme set).
- One `GroupMember` (the owner, `role: "admin"`).
- One `Trip` (`name: "Kyoto Autumn Getaway"`, `status: planning`, dates computed relative to "now" the same way the old seed did — a fixed offset from the seeding/script-run date, so the trip always reads as upcoming rather than drifting into the past).
- A handful of `Activity` rows across the trip's days (temples, a food market, a day trip — reuses the spirit of the old `ACTIVITIES_BY_DAY` content, Kyoto-themed instead of Singapore to read as obviously-different placeholder content, not a reskin of the removed data).
- A few `Expense`/`ExpenseSplit` rows with `paidById: null` / `tempPaidBy: "Alex"` or `"Jordan"` and `ExpenseSplit.userId: null` / `tempName` set per split — two to three generic first names reused consistently across the demo's expenses, satisfying "neutral, generic names" without creating any `User` rows for them.

### 4. Wire up the "look around" links

`GuestJoin` (`src/app/components/pages/GuestJoin/index.tsx`) already does exactly what's needed — call `POST /api/groups/validate-code` with a code, store the result via `setGuestSession`, navigate to `/guest/group/{groupId}`. Add one small capability: accept a `code` search param and auto-run that same submit flow on mount, skipping the manual code-entry boxes (still showing them if the param is absent or invalid, so the page keeps working normally for a real code typed by hand). This is additive to the existing component, not a fork.

- **Onboarding** (`src/app/components/pages/Dashboard/OnboardingWizard/components/ActionStep.tsx`): the "Look around the sample trip first" button currently calls `handleCompleteOnboarding()` with no action, which just closes the wizard onto an (until now) pre-seeded dashboard. Change it to navigate to `/guest/join?code=SAMPLE` directly (no need to also complete onboarding first — looking at the demo doesn't require having set up a profile). `useOnboardingWizard.ts` needs no change; `ActionStep` gets a `router.push` instead of calling `handleCompleteOnboarding`.
- **Dashboard empty state** (`src/app/components/pages/Dashboard/index.tsx`, the `groups.length > 0 ? ... : <div>...</div>` branch around line 69): add a link/button in that empty-state card to `/guest/join?code=SAMPLE`, e.g. "Not ready yet? Look at a demo trip first."

### 5. Admin: remove the dead "clean test data" feature

Once `hasSeededTestData` is gone, the existing admin maintenance action built around it can't compile, let alone work. Remove, rather than repair, since its entire premise (ongoing per-user seeded data to clean) stops being true after this PR. Confirmed `"clean-test-data"` is the *only* value `maintenanceSchema` accepts (`src/app/api/admin/db/schemas.ts`) and the *only* case in the maintenance route's switch — so this isn't a partial trim, the whole maintenance feature is dead:
- Delete `src/app/api/admin/db/maintenance/route.ts` entirely.
- `src/app/api/admin/db/schemas.ts`: remove `maintenanceSchema`/`MaintenanceBody` (now unused).
- `src/app/api/admin/db/repository.ts`: remove `findSeededTestUserIds` and `deleteSampleData`.
- `src/app/api/admin/db/services.ts`: remove `cleanTestDataService`.
- Delete `src/app/admin/database/components/MaintenanceCard.tsx` entirely (its only purpose was this one button).
- `src/app/admin/database/useDbStats.ts`: remove `handleCleanTestData`, `maintaining`, and their returned values.
- `src/app/admin/database/page.tsx`: remove the `<MaintenanceCard maintaining={...} onCleanTestData={...} />` render and its now-unused destructured hook values.
- Update any tests covering the removed functions/route/component.

### 6. One-off production cleanup script (written, not run)

New file: `scripts/cleanup-legacy-seeded-data.ts`. Defaults to dry-run (reports what it would do); only deletes when run with `--execute`. Scope:

1. Find every `Group`/`Trip` row whose name contains `"(sample)"` (the exact marker the old seeder always appended) — report counts, and under `--execute`, delete them (cascades to their activities/expenses/splits/budgets/members, same as the existing — now-removed — `deleteSampleData` did).
2. Find the three legacy dummy `User` rows by their fixed emails (`eleven.dummy@example.com`, `mike.dummy@example.com`, `steve.dummy@example.com`). Report them, and under `--execute`, delete them using the same safe-deletion shape `admin/users/repository.ts`'s `deleteUserKeepingSharedData` already uses (copy the display name onto `tempName`/`tempPaidBy`/etc. on any remaining shared rows before nulling the FK, then delete the row) — reusing that existing function directly rather than re-deriving the same logic, since these rows can still be referenced by `(sample)` groups belonging to OTHER users that this exact same script run is about to delete anyway, or (if run a second time later) might already be gone.
3. Print a summary (counts found / counts deleted) either way.

This script is complete and tested (service-layer tests against a mocked repository, per this repo's test conventions) in this PR, but **not executed against production by me** — the PR description tells the user the exact dry-run and real-run commands to use themselves.

## Testing

- `src/app/api/sync/syncService.test.ts`: updated for the removed seeding call; add/keep a case asserting the legacy-email guard still rejects the three fixed addresses.
- `scripts/seed-demo-trip.ts`: no unit tests (it's a one-shot bootstrap script in the same category as other `scripts/` entries, none of which are unit-tested per existing convention) — verified by actually running it against the local dev database during implementation and checking the resulting group is reachable end-to-end through `/guest/join?code=SAMPLE`.
- `scripts/cleanup-legacy-seeded-data.ts`: unit-tested against a mocked repository (dry-run reporting, `--execute` deletion shape, the three fixed emails), consistent with how other admin-adjacent logic in this repo is tested.
- Admin `db` service/repository tests: remove coverage for the deleted functions; keep the rest passing.
- Manual end-to-end check (part of implementation, not a committed test): run `seed-demo-trip.ts` locally, then visit `/guest/join?code=SAMPLE` and confirm the trip, its tabs, and its expenses render correctly read-only, exactly like a real guest link does today.
- Full existing suite (`npx vitest run`) must stay green throughout.

## Rollout

- One PR off `dev`, e.g. `fix/237-demo-trip`.
- PR description explicitly calls out, as manual follow-ups for the user: (1) run `npx prisma migrate dev` to apply the column drop locally (auto-applies to production on next deploy); (2) after merge, decide when to run `scripts/cleanup-legacy-seeded-data.ts --execute` against production (dry-run output included in the PR for review first).
- Standard flow from here: open the PR, report its link/CI status, stop — merge only on explicit instruction, per the repo's standing merge-approval rule (this rule is about merging, not about the brainstorm/plan gates the user asked to skip for this task).
