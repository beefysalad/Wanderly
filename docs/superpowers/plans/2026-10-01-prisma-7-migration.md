# Prisma 7 Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade Prisma from 6.19 to 7.10 (unblocking Dependabot PR #222 / issue #252) by introducing a `prisma.config.ts` and a `@prisma/adapter-pg` driver adapter, without breaking the Next.js 16 + Turbopack build this app just adopted.

**Architecture:** Keep the legacy `prisma-client-js` generator (verified compatible with driver adapters and with Turbopack, unlike Prisma's own suggested new generator). Move the datasource URL from `schema.prisma` into a new `prisma.config.ts`. Wire `src/lib/prisma.ts`'s singleton to construct a `PrismaPg` adapter and pass it to `PrismaClient`. Add `serverExternalPackages` to `next.config.ts` so Turbopack doesn't try to bundle `@prisma/client`/`pg`. Fix 5 files whose `Decimal` import path (`@prisma/client/runtime/library`) no longer exists in Prisma 7.

**Tech Stack:** Prisma 7.10.0, `@prisma/client` 7.10.0, `@prisma/adapter-pg` 7.10.0, Next.js 16 (Turbopack), Vitest, TypeScript 5.9.

**Spec:** `docs/superpowers/specs/2026-10-01-prisma-7-migration-design.md`

**Setup (before Task 1):** Work in the main repo checkout, not an isolated worktree (standing preference — the user runs the app from this same checkout). From a clean `dev`, create and check out branch `fix/252-prisma-7-migration` before starting Task 1's steps.

## Global Constraints

- Generator block in `prisma/schema.prisma` MUST stay `provider = "prisma-client-js"` with no `output` field — switching to the new `provider = "prisma-client"` breaks Next.js 16 + Turbopack SSR (confirmed in the spec's "Key finding").
- No new automated tests are added — this is a config/infra migration; the existing 688 tests must keep passing unchanged.
- `@prisma/adapter-pg` is the only new driver adapter — do not introduce `@prisma/adapter-neon` or any Accelerate usage (spec non-goals).
- `DATABASE_URL` stays the single connection-string env var — no new env vars.
- Do not run `npm install`'s resulting lockfile changes through anything other than `npm install` itself (repo convention — no manual `package-lock.json` edits).

## Review Focus

- **Live database connectivity actually works through the new adapter, not just typechecks** — a missing/misconfigured adapter wiring would still typecheck fine but fail at runtime. Owned by Task 3's live query check.
- **Next.js 16 + Turbopack dev server doesn't regress** — this is the exact documented bug (`Cannot find module '.prisma/client/default'`) this plan works around; a production build alone might not reproduce it. Owned by Task 2's dev-server smoke test.
- **Production build (`npm run build:ci`) succeeds end-to-end** — exercises the real Turbopack + Prisma 7 interaction, not a secondhand blog claim. Owned by Task 2's build step.
- **Money-bearing code (budgets, expenses, payments, payment logs) still constructs `Decimal` amounts correctly** after the import-path fix — a typo'd replacement (e.g. wrong namespace) would still typecheck in some cases but silently compute wrong values. Owned by Task 1's full test suite run, which already exercises every one of the 5 fixed files.
- **`prisma migrate deploy` (the command Vercel's production build actually runs, not `prisma generate`) reads the connection URL from `prisma.config.ts` correctly** — Prisma's own error message specifically calls out Migrate's URL resolution as the thing that moved. Owned by Task 3's `prisma migrate status` check.

---

## Task 1: Bump Prisma to 7, wire the driver adapter, fix the Decimal import break

**Files:**
- Modify: `package.json`
- Modify: `prisma/schema.prisma`
- Create: `prisma.config.ts`
- Modify: `src/lib/prisma.ts`
- Modify: `src/app/api/trips/[tripId]/budgets/repository.ts`
- Modify: `src/app/api/trips/[tripId]/expenses/repository.ts`
- Modify: `src/app/api/trips/[tripId]/expenses/[expenseId]/payments/repository.ts`
- Modify: `src/app/api/trips/[tripId]/payment-logs/repository.ts`
- Modify: `src/lib/socket-events.test.ts`

**Interfaces:**
- Consumes: nothing from other tasks (this is the first task).
- Produces: `prisma` export from `src/lib/prisma.ts` (unchanged shape: a `PrismaClient` instance) now backed by a driver adapter; `prisma.config.ts`'s `defineConfig` export (consumed implicitly by the `prisma` CLI, not imported by app code); all 5 fixed files continue exporting exactly what they did before (only their internal `Decimal` construction changes, not their public functions' signatures).

- [ ] **Step 1: Update `package.json` dependencies**

In the `"dependencies"` block, change:
```json
    "@prisma/client": "^6.19.0",
    "@prisma/extension-accelerate": "^2.0.2",
```
to:
```json
    "@prisma/adapter-pg": "^7.10.0",
    "@prisma/client": "^7.10.0",
```
(alphabetical order — `@prisma/adapter-pg` sorts before `@prisma/client`; `@prisma/extension-accelerate` is removed entirely, confirmed unused by the design spec).

In the `"devDependencies"` block, change:
```json
    "prisma": "^6.19.0",
```
to:
```json
    "dotenv": "^17.2.3",
    "prisma": "^7.10.0",
```
(insert `dotenv` alphabetically — it belongs before `eslint` in the existing list; match the `dotenv` version already used in `"dependencies"` for consistency, or whatever `npm install dotenv` resolves to).

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: completes without error; `package-lock.json` is updated. A `postinstall` failure here (from `prisma generate`) is expected and fine — it's fixed in Step 5.

- [ ] **Step 3: Remove the `url` line from `prisma/schema.prisma`'s datasource block**

Change:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```
to:
```prisma
datasource db {
  provider = "postgresql"
}
```
Leave the `generator client { provider = "prisma-client-js" }` block above it completely unchanged.

- [ ] **Step 4: Create `prisma.config.ts` at the repo root**

```ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

- [ ] **Step 5: Run `prisma generate` to confirm the schema/config fix works**

Run: `npx prisma generate`
Expected: `Prisma schema loaded from prisma/schema.prisma.` followed by `✔ Generated Prisma Client (v7.10.0) to ./node_modules/@prisma/client`. No `P1012` validation error. (If `DATABASE_URL` isn't set in your shell, source it: `set -a; source .env; set +a` first — `prisma.config.ts`'s `env()` throws if it's missing.)

- [ ] **Step 6: Wire the driver adapter into `src/lib/prisma.ts`**

Replace the full file with:
```ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
```

- [ ] **Step 7: Run typecheck to confirm only the expected Decimal breakage remains**

Run: `npx tsc --noEmit`
Expected: exactly 5 errors, one per file below, each reading `error TS2307: Cannot find module '@prisma/client/runtime/library' or its corresponding type declarations.`:
- `src/app/api/trips/[tripId]/budgets/repository.ts`
- `src/app/api/trips/[tripId]/expenses/repository.ts`
- `src/app/api/trips/[tripId]/expenses/[expenseId]/payments/repository.ts`
- `src/app/api/trips/[tripId]/payment-logs/repository.ts`
- `src/lib/socket-events.test.ts`

If there are other, different errors, stop and investigate before continuing — that means something besides the known Decimal break regressed.

- [ ] **Step 8: Fix `src/app/api/trips/[tripId]/budgets/repository.ts`**

Replace:
```ts
import prisma from "@/src/lib/prisma";
import type { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
```
with:
```ts
import prisma from "@/src/lib/prisma";
import { Prisma } from "@prisma/client";
```
Then replace both occurrences of `new Decimal(` with `new Prisma.Decimal(` (lines currently at 39 and 57: `data: { ...data, amount: new Decimal(data.amount) },` and `amount: data.amount !== undefined ? new Decimal(data.amount) : undefined,`).

- [ ] **Step 9: Fix `src/app/api/trips/[tripId]/expenses/repository.ts`**

Replace:
```ts
import prisma from "@/src/lib/prisma";
import type { PaymentMethod, Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
```
with:
```ts
import prisma from "@/src/lib/prisma";
import { Prisma, type PaymentMethod } from "@prisma/client";
```
Then replace both occurrences of `new Decimal(` with `new Prisma.Decimal(` (currently at lines 77 and 108: `data: { ...data, amount: new Decimal(amount), splits: { create: splits } },` and `if (amount !== undefined) data.amount = new Decimal(amount);`).

- [ ] **Step 10: Fix `src/app/api/trips/[tripId]/expenses/[expenseId]/payments/repository.ts`**

Replace:
```ts
import prisma from "@/src/lib/prisma";
import { SPLIT_ORDER } from "../../repository";
import type { PaymentMethod } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
```
with:
```ts
import prisma from "@/src/lib/prisma";
import { SPLIT_ORDER } from "../../repository";
import { Prisma, type PaymentMethod } from "@prisma/client";
```
Then replace both occurrences of `new Decimal(` with `new Prisma.Decimal(` (currently at lines 88 and 136, both reading `amount: new Decimal(log.amount),`).

- [ ] **Step 11: Fix `src/app/api/trips/[tripId]/payment-logs/repository.ts`**

Replace:
```ts
import prisma from "@/src/lib/prisma";
import type { PaymentMethod, Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
```
with:
```ts
import prisma from "@/src/lib/prisma";
import { Prisma, type PaymentMethod } from "@prisma/client";
```
Then replace the one occurrence of `new Decimal(` with `new Prisma.Decimal(` (currently at line 43: `data: { ...data, amount: new Decimal(data.amount) },`).

- [ ] **Step 12: Fix `src/lib/socket-events.test.ts`**

Replace:
```ts
import { Decimal } from "@prisma/client/runtime/library";
```
with:
```ts
import { Prisma } from "@prisma/client";
```
Then replace the one occurrence of `new Decimal(` with `new Prisma.Decimal(` (currently at line 140: `amount: new Decimal("42.50"),`).

- [ ] **Step 13: Run typecheck to confirm it's fully clean**

Run: `npx tsc --noEmit`
Expected: no output, exit code 0.

- [ ] **Step 14: Run the full test suite**

Run: `npx vitest run`
Expected: `Test Files  90 passed (90)` / `Tests  688 passed (688)` — same counts as before this migration started.

- [ ] **Step 15: Run lint**

Run: `npm run lint`
Expected: `0 errors` (the existing 3 pre-existing unused-var warnings are fine and expected; no new warnings or errors).

- [ ] **Step 16: Commit**

```bash
git add package.json package-lock.json prisma/schema.prisma prisma.config.ts src/lib/prisma.ts \
  "src/app/api/trips/[tripId]/budgets/repository.ts" \
  "src/app/api/trips/[tripId]/expenses/repository.ts" \
  "src/app/api/trips/[tripId]/expenses/[expenseId]/payments/repository.ts" \
  "src/app/api/trips/[tripId]/payment-logs/repository.ts" \
  src/lib/socket-events.test.ts
git commit -m "fix(deps): upgrade Prisma to 7 with a driver adapter"
```

---

## Task 2: Keep Next.js 16 + Turbopack working with Prisma 7

**Files:**
- Modify: `next.config.ts`

**Interfaces:**
- Consumes: the adapter-backed `prisma` singleton from Task 1 (exercised indirectly via any API route that queries the database, e.g. `/api/health`).
- Produces: nothing new consumed by later tasks — this task's only output is a working build/dev server, verified by its own steps.

- [ ] **Step 1: Add `serverExternalPackages` to `next.config.ts`**

Replace:
```ts
const nextConfig: NextConfig = {
  images: {
```
with:
```ts
const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "pg"],
  images: {
```
(The rest of the file — `images`, `headers()`, the default export — stays exactly as is.)

- [ ] **Step 2: Run a production build**

Run: `npm run build:ci`
Expected: completes successfully (prints the full route table at the end, no errors). This exercises `prisma generate` (from Task 1) immediately followed by `next build --turbopack`, which is the exact combination that broke on other Next 16 + Prisma 7 projects without this config.

- [ ] **Step 3: Smoke-test the Turbopack dev server**

Run: `npm run dev` in the background (e.g. `npm run dev &` or a separate terminal), wait for `Ready in`, then:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/health
```
Expected: `200`. This is the specific scenario the documented Next 16 + Turbopack + Prisma 7 bug breaks (`Cannot find module '.prisma/client/default'` during SSR) — a production build succeeding is not sufficient proof on its own. Stop the dev server afterward (`kill %1` or Ctrl-C in its terminal).

- [ ] **Step 4: Commit**

```bash
git add next.config.ts
git commit -m "fix(config): externalize @prisma/client and pg for Turbopack"
```

---

## Task 3: Verify the real database connection end-to-end, then open the PR

**Files:**
- None modified (verification only, plus the PR itself).

**Interfaces:**
- Consumes: the fully-wired `prisma` singleton (Task 1) and the Turbopack-safe `next.config.ts` (Task 2).
- Produces: nothing further — this is the terminal task.

- [ ] **Step 1: Write a throwaway live-connection check script**

Create `scripts/_verify_prisma_connection.mjs` (prefixed with `_` and never committed — deleted in Step 4):
```js
import prisma from "../src/lib/prisma.ts";

const count = await prisma.user.count();
console.log(`Connected. User count: ${count}`);
await prisma.$disconnect();
```

- [ ] **Step 2: Run it against the real local database**

Run: `npx tsx scripts/_verify_prisma_connection.mjs`
Expected: prints `Connected. User count: <some number>` and exits cleanly (no hang — confirms `$disconnect()` actually closes the adapter's underlying `pg.Pool`). If this throws a connection error, the adapter wiring from Task 1 Step 6 is wrong — stop and fix it there, don't patch around it here.

- [ ] **Step 3: Confirm Migrate reads `prisma.config.ts` correctly**

Run: `npx prisma migrate status`
Expected: reports the database is up to date with `prisma/migrations` (no `P1012` or connection errors). This specifically exercises Migrate's URL resolution through `prisma.config.ts`, which is the exact thing Prisma's original error message called out — `prisma generate` succeeding alone (Task 1 Step 5) doesn't prove this works.

- [ ] **Step 4: Delete the throwaway script**

```bash
rm scripts/_verify_prisma_connection.mjs
```
Confirm it's not staged: `git status --short` should not list it.

- [ ] **Step 5: Push the branch and open the PR**

```bash
git push -u origin fix/252-prisma-7-migration
gh pr create --title "fix(deps): upgrade Prisma to 7 with a driver adapter" --body "$(cat <<'EOF'
## Summary
- Upgrades Prisma from 6.19 to 7.10 (closes #252, supersedes #222), which Dependabot's own PR couldn't do as a drop-in bump: Prisma 7 removed `datasource.url` from schema.prisma and made a driver adapter mandatory.
- Keeps the legacy `prisma-client-js` generator (not Prisma's suggested new one) because the new generator breaks this app's Next.js 16 + Turbopack build — verified directly against the Next 16 + Turbopack + Prisma 7 incompatibility.
- Adds `@prisma/adapter-pg`, wired into the existing `src/lib/prisma.ts` singleton; connection behavior is unchanged (same `DATABASE_URL`, same TCP connection via `pg`).
- Fixes 5 files that imported `Decimal` from the now-removed `@prisma/client/runtime/library` path, switching them to `Prisma.Decimal` (the pattern already used elsewhere in the codebase).
- Removes the unused `@prisma/extension-accelerate` dependency.

## Test plan
- [x] `npx prisma generate` succeeds
- [x] `npx tsc --noEmit` clean
- [x] `npm run lint` clean
- [x] `npx vitest run` — 688/688 passing
- [x] `npm run build:ci` succeeds (production build with Turbopack)
- [x] Dev server smoke test (`npm run dev` + `/api/health`) returns 200
- [x] Live query against the real database succeeds and disconnects cleanly
- [x] `npx prisma migrate status` confirms Migrate resolves the connection via `prisma.config.ts`
EOF
)"
```

- [ ] **Step 6: Close PR #222 as superseded**

```bash
gh pr comment 222 --body "Superseded by $(gh pr view --json url -q .url) — the plain CLI bump needed a real migration (driver adapter + prisma.config.ts), not a dependency bump. Closing this one."
gh pr close 222
```

- [ ] **Step 7: Report and stop**

Report the new PR's link, its CI status, and that #222 was closed as superseded. Per the repo's standing rule, do not merge — the user merges when ready.
