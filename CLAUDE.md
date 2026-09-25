# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

This file is the single source of truth for conventions. Design specs and implementation plans for the ongoing cleanup live in `docs/superpowers/specs/` and `docs/superpowers/plans/`; read the relevant spec before large changes (the cleanup spec's tracking table and "Handoff Notes" record what is migrated and known gotchas).

## Repository Shape

Single Next.js 15 App Router app (Node 22.12+), not a monorepo. No workspaces, no `packages/*`.

- `src/app/` — routes (`page.tsx`, `layout.tsx`, `loading.tsx`) and API routes (`src/app/api/**/route.ts`).
- `src/app/components/pages/<Feature>/` — route-specific, logic-heavy components (e.g. `Trip`, `Expenses`, `Dashboard`).
- `src/app/components/shared/<Feature>/` — components reused across routes (e.g. `ExpenseForm`, `Modal`).
- `src/hooks/` — TanStack Query hooks (`useTrips`, `useExpenses`, ...). Imported as `@/src/hooks/...`.
- `src/shared/types/` — shared TS types. Imported as `@/src/shared/types`.
- `components/` (repo root, **not** under `src/`) — shadcn/ui primitives (`components/ui/*`) and a couple of top-level shared components (`socket-provider.tsx`). Imported as `@/components/...`.
- `lib/` (repo root, **not** under `src/`) — singletons and utilities: `prisma.ts`, `firebase.ts`, `firebase-admin.ts`, `axios.ts`, `socket.ts`, `logger.ts`, `admin-auth.ts`, `rate-limit.ts`, `helper.ts`, `utils.ts`, `auth/with-auth.ts`. Imported as `@/lib/...`.
- `prisma/` — `schema.prisma` and migrations.
- `scripts/` — one-off maintenance scripts run with `tsx` (e.g. `sync-admin-password.ts`), not part of the app runtime.

**Known layout quirk (planned restructure):** shared code is split between the repo root (`components/`, `lib/`) and `src/` (`app`, `hooks`, `shared`). This is intentional for now and everything below documents it as is; the maintainer plans to consolidate it under `src/` in a dedicated mechanical PR (move + codemod of `@/lib` and `@/components` imports + `tsconfig`/`components.json` updates) after in-flight work lands. Do not create `src/components/` or `src/lib/`, and do not move files between the two trees opportunistically.

Import aliasing: `tsconfig.json` maps `@/*` → repo root (`./*`), so `@/lib/...` and `@/components/...` resolve at the root, while anything under `src/` is imported with the `src` segment included (`@/src/hooks/...`, `@/src/shared/types`). `components.json` (shadcn) declares `"hooks": "@/hooks"`, which does not match actual usage (`@/src/hooks`) — don't trust that file for hook imports; it's only accurate for `ui`/`components`/`lib`.

## Common Commands

```bash
npm run dev              # next dev --turbopack
npm run build            # prisma generate && prisma migrate deploy && next build
npm run build:ci         # prisma generate && next build (no DB migration) — what CI runs
npm run start
npm run lint             # eslint
npm run test             # vitest run (tests are colocated as *.test.ts next to the source)
npm run test:watch

npm run db:generate      # prisma generate
npm run db:migrate       # prisma migrate dev — do not run unless the user asks
npm run db:studio
```

Vitest is configured in `vitest.config.mts` with the `@/*` alias. Coverage is intentionally focused: service-layer tests (repository mocked) and schema tests, added per feature as it is migrated to the service/repository layering below. Most un-migrated features still have no tests — don't assume coverage exists for a file just because the runner does. CI (`.github/workflows/checks.yml`) runs lint, test, and `build:ci` on every PR.

Do not run `prisma migrate dev`/`deploy` or `npm install` unless the user explicitly asks — tell them the exact command instead.

## Environment Variables

No `.env.example` currently exists — `.env` (gitignored, present locally) is the only reference for required vars: Firebase (`FIREBASE_*`, `NEXT_PUBLIC_FIREBASE_*`), Postgres/Neon (`DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `PG*`, `POSTGRES_*`), Cloudinary (`CLOUDINARY_*`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`), `ADMIN_PASSWORD`, `NEXT_PUBLIC_SOCKET_URL`. Browser-exposed vars must be `NEXT_PUBLIC_`-prefixed; everything else must stay server-only. If you add a required var, create a `.env.example` with placeholder values rather than leaving `.env` as the only source of truth.

## Frontend Patterns

- Server Components by default; add `"use client"` only for state/effects/interactivity.
- Forms: React Hook Form + Zod resolvers (see `AuthForm`, `ExpenseForm`, `EditProfileModal` for the pattern).
- Server state: TanStack Query hooks in `src/hooks/`; components consuming them handle `isPending`/`isLoading`/`isError` explicitly rather than assuming data is present.
- HTTP: shared Axios instance at `lib/axios.ts`.
- UI primitives: shadcn/ui components in `components/ui/`, style `new-york`, icons via `lucide-react`. Add new primitives with `npx shadcn@latest add <name>` only after user approval — don't hand-roll a primitive that shadcn already provides.
- Real-time: Socket.IO client via `lib/socket.ts` / `src/hooks/useSocket*`, supporting both Firebase-authenticated users and guest sessions (group code).
- Keep page-level components in `src/app/components/pages/<Feature>/index.tsx` from growing into 500–1000+ line files (several already have — `ExpenseForm`, `Trip`, `OnboardingWizard`, `Expenses`, `Profile`). Split by sub-section/concern instead of adding to the existing file when a component crosses ~300 lines.

## Design & UX Conventions

- Aesthetic: clean, flat and modern: solid colors and subtle borders rather than heavy shadows or gradients, generous whitespace, rounded corners.
- Mobile-first: every view must work on a phone (touch targets, readable text). Navigation is a bottom bar on mobile, often hidden on detail sub-pages.
- Icons: `lucide-react` at consistent sizes. Notifications to the user: `sonner` toasts.
- Conditional class names: `cn()` from `lib/utils.ts`; Tailwind utility classes, no inline styles.

## Backend / API Patterns

- Route handlers live at `src/app/api/**/route.ts`; larger features split business logic into a sibling `services.ts` (e.g. `expenses/services.ts`, `groups/services.ts`) — keep that split, don't inline heavy logic back into the route handler.
- Use Next's dynamic route params (`context.params`) for path segments — do not parse `req.nextUrl.pathname` manually to extract IDs (existing code in `expenses/route.ts` does this; it's fragile and shouldn't be the template for new routes).

### Service / Repository Layering (target pattern)

Existing `services.ts` files call Prisma directly and mix business logic with data access in one file (e.g. `expenses/services.ts` is 1,028 lines doing both). Going forward, split new and touched features into three layers:

- **Route handler** (`route.ts`) — thin. Parses `context.params`, validates the body with Zod, calls the service, maps the result to an `NextResponse`. No business logic, no Prisma imports.
- **Service** (`services.ts`) — business logic and orchestration only: enforcing rules (e.g. "guests can't create expenses"), coordinating multiple repositories, computing derived values (e.g. expense-split math). Services call repositories, never `prisma` directly.
- **Repository** (new — e.g. `repository.ts` or `<feature>.repository.ts` next to `services.ts`) — the only place that imports `@/lib/prisma` and issues Prisma calls for that feature. One function per query/mutation (`findTripById`, `createExpense`, `listExpensesByGroup`, ...), typed inputs/outputs, no business rules.

Migrate a feature to this shape when you're already making a non-trivial change to it — don't do a drive-by refactor of unrelated `services.ts` files just to add the repository layer.
- **Validate every request body with Zod before using it.** Migrated features (Profile, Reviews, Groups) validate with a colocated `schemas.ts` and `.parse()` in the route, with `handleApiError` mapping failures to a 400. Routes not yet migrated (Trips/Activities/Budget/Expenses/admin/etc.) still destructure `req.json()` directly with only compile-time types. New/edited routes must define a schema and `.parse()` the body before touching Prisma. Note `z.coerce.date()` turns `null` into 1970-01-01 — guard date fields with a non-empty string/number check first (see `groups/[groupId]/trips/schemas.ts`).
- Auth: wrap protected routes with `withAuth` (Firebase ID token required) or `withOptionalAuth` (`lib/auth/with-auth.ts`) for routes that also serve guests via `X-Guest-Code`. When using `withOptionalAuth`, the handler/service is responsible for re-verifying the guest code against the actual group/trip being accessed — the wrapper does not do this itself, so don't assume `context.groupCode` is already validated.
- Admin routes currently gate on a single shared password (`lib/admin-auth.ts`, compared with `===`, no hashing). Treat this as a known weak point, not a pattern to copy — new admin/privileged functionality should not add more surface behind the same shared-password check without discussing it with the user first.
- Prisma access goes through the singleton in `lib/prisma.ts`. Business decisions belong in `services.ts`, not the route handler or the Prisma call site.
- Use `logger` (`lib/logger.ts`) instead of raw `console.*` in `src/` and `lib/` — existing `console.*` calls (60+) are inconsistent, not the standard to follow.

## Data Model

Core Prisma models: `User` → `Group` (via `GroupMember`) → `Trip` → `Activity`/`Expense`. Expenses split via `ExpenseSplit`, settlements via `ExpensePayment`/`PaymentLog`. Admin/system config lives in `AppConfig` (key/value), including the admin password fallback and "what's new" content. Check `prisma/schema.prisma` directly for current fields/relations rather than relying on this summary for anything non-trivial.

## Things Not to Propagate

These exist in the codebase today — don't use them as the template for new code:
- Manual `pathname.split("/")` parsing instead of `context.params`.
- API routes with no Zod validation.
- `services.ts` files calling Prisma directly instead of going through a repository (see **Service / Repository Layering** above).
- New functionality gated behind the shared admin password instead of proper role-based auth.
- One-off debug/repro scripts committed at the repo root — put throwaway scripts in `scripts/` or don't commit them.
- Growing an existing 500+ line page component further instead of splitting it.

## Git Conventions

Do not add Claude Code / AI attribution to commit messages or pull request descriptions (no `Co-Authored-By: Claude`, no "Generated with Claude Code" footer, etc.). Commits and PRs from this repo should read as if written by the developer alone.
