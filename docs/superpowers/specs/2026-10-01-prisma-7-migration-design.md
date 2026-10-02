# Prisma 6 → 7 migration

## Context

Dependabot PR #222 bumps the `prisma` CLI devDependency from 6.19.3 to 7.10.0. Its CI fails at `npm ci`'s `postinstall` (`prisma generate`):

```
Error: Prisma schema validation - (get-config wasm)
Error code: P1012
error: The datasource property `url` is no longer supported in schema files. Move connection URLs for
Migrate to `prisma.config.ts` and pass either `adapter` for a direct database connection or
`accelerateUrl` for Accelerate to the `PrismaClient` constructor.
  -->  prisma/schema.prisma:7
```

This isn't a drop-in version bump: Prisma 7 removed reading `DATABASE_URL` directly from `schema.prisma`'s `datasource` block, and made a driver adapter mandatory for `PrismaClient` unless using Prisma Accelerate (which this app doesn't use — `@prisma/extension-accelerate` is an installed-but-unused dependency). This work was filed as issue #252 and supersedes PR #222.

## Goals

- Unblock the Prisma 7 upgrade so `prisma generate`/`migrate deploy` and the app's `PrismaClient` singleton work under Prisma 7.
- Preserve current runtime behavior exactly: same database (Neon Postgres over `DATABASE_URL`), same connection semantics, no new infra dependency (e.g. no Accelerate, no Neon serverless driver) unless something in this migration requires it.
- Keep the app working under Next.js 16 + Turbopack, which this repo adopted in the immediately preceding dependency-fix round (see `git log` for the `next-16.3.6` Dependabot fix).

## Non-goals

- Switching to Prisma's new ESM-first `provider = "prisma-client"` generator (ruled out below — it breaks this app's exact stack).
- Adopting `@prisma/adapter-neon` or any other serverless-specific driver adapter. There's no evidence of connection exhaustion or other problems that would justify it; `@prisma/adapter-pg` preserves today's connection behavior exactly. This can be revisited later as a contained, one-file change if needed.
- Any new automated tests. This is a config/infrastructure migration; the existing 688 tests already mock Prisma at the repository layer and only need to keep passing.

## Key finding: generator provider must stay `prisma-client-js`

Prisma's own upgrade guide recommends switching `schema.prisma`'s generator block to the new `provider = "prisma-client"` with a custom `output` path (e.g. `./generated/prisma`), replacing the legacy `prisma-client-js` provider that generates into `node_modules/@prisma/client`.

However, this new provider's ESM-optimized output breaks Next.js 16 + Turbopack: Turbopack's module hashing loses the reference to the client's internal runtime during SSR, producing `Cannot find module '.prisma/client/default'`. Since this repo just adopted Next 16 + Turbopack, adopting the new generator at the same time would reintroduce a broken build.

**Decision:** keep `provider = "prisma-client-js"` (no `output` field) in `schema.prisma`'s generator block. This was verified directly against the real Prisma 7.10.0 package (not just secondhand docs): generating with the legacy provider still produces a client in `node_modules/@prisma/client`, and that generated client's types (`runtime/client.d.ts`) fully support and in fact require the `adapter` option — driver adapters are not tied to the new generator. A minimal `new PrismaClient({ adapter })` with `@prisma/adapter-pg` typechecked cleanly against the real generated types in this verification.

Because the generator provider doesn't change, **no import paths change** anywhere in the app — `import { PrismaClient } from "@prisma/client"` and `import type { Prisma } from "@prisma/client"` continue to resolve exactly as they do today. This avoids the "update every import path" step that Prisma's generic upgrade guide calls for.

## Design

### 1. Package changes (`package.json`)

- `prisma`: `^6.19.0` → `^7.10.0` (already bumped on the Dependabot branch; carried into this PR).
- `@prisma/client`: `^6.19.0` → `^7.10.0` (currently mismatched with the CLI version — this mismatch is the direct cause of PR #222's failure, since Dependabot only bumped the CLI devDependency, not the client).
- Add `@prisma/adapter-pg` `^7.10.0` (bundles `pg` as its own dependency — no separate `pg` install needed).
- Add `dotenv` as a devDependency — `prisma.config.ts` needs it to load `.env` when the Prisma CLI runs outside Next's own process (`prisma generate`, `prisma migrate deploy`, `prisma studio`, all invoked directly via `npx prisma ...` / `scripts/build.mjs`, which don't get Next's automatic `.env` loading). This is a no-op on Vercel, which injects env vars directly into `process.env` rather than via a `.env` file — `dotenv`'s default behavior is to silently do nothing when no `.env` file is present.
- Remove `@prisma/extension-accelerate` (confirmed unused anywhere in the codebase via full-repo grep; approved for removal as part of this change rather than carried forward untested into Prisma 7).

### 2. `prisma/schema.prisma`

Remove the `url = env("DATABASE_URL")` line from the `datasource db` block. The block becomes:

```prisma
datasource db {
  provider = "postgresql"
}
```

Generator block is unchanged (`provider = "prisma-client-js"`, no `output` field) — see "Key finding" above.

### 3. New `prisma.config.ts` (repo root, alongside `package.json`)

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

This is what `prisma migrate deploy`/`dev`/`studio` now read for the connection URL, replacing the schema's old `url` field. Verified directly: `npx prisma generate` with this file in place prints `Loaded Prisma config from prisma.config.ts.` and succeeds.

No `seed` entry — this repo has no `prisma db seed` setup today (confirmed: no `seed` key in `package.json`, no `prisma/seed.ts`), so none is added.

### 4. `src/lib/prisma.ts`

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

Same singleton caching pattern as today; only the construction call changes.

### 5. `next.config.ts`

Add `serverExternalPackages: ["@prisma/client", "pg"]` to the config object, so Turbopack treats these as external (server-only) packages instead of trying to bundle them — the documented fix for the Next 16 + Turbopack + Prisma 7 interaction.

### 6. Fix `Decimal` imports (breaking change, found during verification, not mentioned in Prisma's own error message)

Prisma 7 removed the `@prisma/client/runtime/library` subpath export. Five files import `Decimal` from it:

- `src/app/api/trips/[tripId]/budgets/repository.ts`
- `src/app/api/trips/[tripId]/expenses/repository.ts`
- `src/app/api/trips/[tripId]/expenses/[expenseId]/payments/repository.ts`
- `src/app/api/trips/[tripId]/payment-logs/repository.ts`
- `src/lib/socket-events.test.ts`

Fix: use `Prisma.Decimal` instead, matching the pattern already used elsewhere in the codebase (`expenses/transformers.ts`, `expenses/transformers.test.ts` already do this). Where a file currently does `import type { Prisma } from "@prisma/client"`, that becomes a value import (`import { Prisma } from "@prisma/client"`) since `Prisma.Decimal` is used as a constructor (`new Prisma.Decimal(...)`), not just a type.

Verified directly: `import { Decimal } from "@prisma/client"` (bare named export) does **not** exist in Prisma 7's generated types, but `Prisma.Decimal` does.

### 7. Verification plan

In order, each must pass before moving to the next:

1. `npx prisma generate` — schema validates, client generates without error.
2. `npx tsc --noEmit` — clean, including the 5 `Decimal` fix sites.
3. `npm run lint` — clean (same pre-existing warnings as before, no new ones).
4. `npx vitest run` — full suite (688 tests) passes unchanged; these mock Prisma at the repository layer, so they verify nothing about the real adapter but must not regress.
5. **Live database check** — using the real local `.env`'s `DATABASE_URL` (a real Neon connection, not mocked), confirm the adapter actually connects and can run a real query (e.g. `prisma.user.count()` via a throwaway script, or `npx prisma migrate status`). This is the step that actually validates the migration's point — everything above can pass with a typo'd connection string.
6. `npm run build:ci` (`prisma generate && next build --turbopack`) — confirms the Turbopack + Prisma 7 interaction actually builds cleanly, since that's an empirical claim from a third-party blog post, not Prisma's own docs.
7. `npm run dev` smoke test — start the Turbopack dev server and hit one API route that queries Prisma (e.g. `GET /api/health`), since the documented Turbopack bug was specifically about dev/SSR-time module resolution, which a production build alone might not reproduce either way.

If step 5, 6, or 7 fails, that's new information requiring a design revision, not a reason to skip the step.

### 8. Rollout

- New branch off `dev` (e.g. `fix/252-prisma-7-migration`), not a reuse of the Dependabot-owned branch.
- One PR, referencing issue #252.
- Close PR #222 as superseded once this PR is open (its branch/content is subsumed by this work).
- Standard flow from here: open the PR, report its link/CI status, stop — merge only on explicit instruction, per the repo's standing merge-approval rule.

## Risks / things to watch

- **Connection pool defaults differ** between Prisma's old built-in binary engine and `@prisma/adapter-pg`'s direct use of `pg.Pool`. If the live/build checks above pass but production later shows connection timeouts or exhaustion under load, the fix is a `@prisma/adapter-pg` pool-size config tweak or, if that's insufficient, switching to `@prisma/adapter-neon` — a contained, one-file change given the adapter pattern already in place. Not pre-emptively addressed here (no evidence of a problem; YAGNI).
- **`prisma.config.ts` TypeScript loading** — confirmed empirically that `npx prisma generate` loads it directly without a separate build step, but this should be re-confirmed for `prisma migrate deploy` specifically during verification step 5, since that's the command that runs in Vercel's production build (`scripts/build.mjs`).
