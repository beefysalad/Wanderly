# Code Cleanup Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the shared infrastructure (repo hygiene, typed errors, Vitest, CI checks) that every subsequent feature-migration plan (Profile, Reviews, Groups, Trips...) depends on.

**Architecture:** No feature logic changes here. Adds `lib/errors.ts` and `lib/handle-api-error.ts` as the shared error-handling contract routes will use, configures Vitest with the `@/*` path alias already defined in `tsconfig.json`, and adds a GitHub Actions workflow that runs lint + test + a DB-free build on every PR.

**Tech Stack:** TypeScript, Next.js 15 App Router, Vitest, vite-tsconfig-paths, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-22-code-cleanup-design.md`

## Global Constraints

- No AI/Claude Code attribution in commit messages or PR descriptions (per `CLAUDE.md` Git Conventions).
- Do not touch the admin-password auth, the `/api/v1/gateway` proxy, or guest-code validation — those are a separate security pass (per spec Non-Goals).
- Tests are colocated as `<file>.test.ts` next to the source file they test.
- This is one branch/PR (`refactor/foundation-infra`), based on `dev`. It must leave the app fully working — `npm run build` (the real, unmodified script) must still succeed at the end.

---

### Task 1: Repo hygiene

**Files:**
- Delete: `src/components/` (empty directory)
- Delete: `src/lib/` (empty directory, including empty `src/lib/utils/`)
- Move: `repro_delete.ts` → `scripts/repro-delete.ts`
- Delete: `234271951.png`
- Modify: `.cursorrules:1`, `AI_CONTEXT.md:1`

**Interfaces:** None — this task touches no runtime code.

- [ ] **Step 1: Confirm the dead directories are actually empty before deleting**

Run: `find src/components src/lib -type f`
Expected: no output (empty). If this prints any file, STOP and investigate before deleting — do not delete a directory with contents.

- [ ] **Step 2: Remove the dead directories**

`src/lib` contains a nested empty `src/lib/utils/` subdirectory, so plain `rmdir` will fail (non-empty from `rmdir`'s point of view). Since Step 1 already confirmed there are no files anywhere under either tree, remove them recursively:

```bash
rm -rf src/components src/lib
```

(Neither directory was tracked by git — empty directories never are — so there's nothing to `git rm`.)

- [ ] **Step 3: Move the repro script into `scripts/`**

```bash
git mv repro_delete.ts scripts/repro-delete.ts
```

- [ ] **Step 4: Remove the stray unreferenced screenshot**

Verify first it's genuinely unused:

Run: `grep -rl "234271951" --include='*.ts*' --include='*.md' . 2>/dev/null | grep -v node_modules`
Expected: no output.

Then:

```bash
git rm 234271951.png
```

- [ ] **Step 5: Point the stale docs at CLAUDE.md instead of duplicating/contradicting it**

Add this line as the new first line of `.cursorrules` (before its existing `# Cursor Rules...` heading):

```
> Structure/conventions below may be out of date — CLAUDE.md at the repo root is authoritative.
```

Add this line as the new first line of `AI_CONTEXT.md` (before its existing `# Travel Schedule App...` heading):

```
> Structure/conventions below may be out of date — CLAUDE.md at the repo root is authoritative.
```

- [ ] **Step 6: Verify the app still builds**

Run: `npm run lint && npx tsc --noEmit`
Expected: both succeed with no errors (deleting empty dirs and moving an unreferenced script should not affect either).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: repo hygiene - remove dead dirs and stray files, flag stale docs"
```

---

### Task 2: Vitest setup

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (add `test`, `test:watch` scripts and devDependencies)
- Create: `lib/utils.test.ts`

**Interfaces:**
- Produces: `npm run test` (single run, used by CI) and `npm run test:watch` (local dev loop), available to every later plan.

- [ ] **Step 1: Install Vitest and the tsconfig-paths plugin**

```bash
npm install -D vitest vite-tsconfig-paths
```

- [ ] **Step 2: Create the Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "lib/**/*.test.ts"],
  },
});
```

- [ ] **Step 3: Add test scripts to `package.json`**

In the `"scripts"` block, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Write a failing test for an existing, currently-untested utility**

`lib/utils.ts` already exports `formatTime12Hour` with no test coverage anywhere in the repo. Create `lib/utils.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatTime12Hour } from "./utils";

describe("formatTime12Hour", () => {
  it("converts a morning time", () => {
    expect(formatTime12Hour("09:00")).toBe("9:00 AM");
  });

  it("converts an afternoon time", () => {
    expect(formatTime12Hour("14:30")).toBe("2:30 PM");
  });

  it("converts midnight to 12 AM", () => {
    expect(formatTime12Hour("00:00")).toBe("12:00 AM");
  });

  it("converts noon to 12 PM", () => {
    expect(formatTime12Hour("12:00")).toBe("12:00 PM");
  });

  it("returns an empty string unchanged", () => {
    expect(formatTime12Hour("")).toBe("");
  });
});
```

- [ ] **Step 5: Run the test to verify the config and the test both work**

Run: `npm run test`
Expected: PASS — 5 tests passed in `lib/utils.test.ts`. (This is not a "should fail first" case — `formatTime12Hour` already exists and works; the point of this step is proving the Vitest + path-alias setup is wired correctly against real, already-shipped code.)

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts lib/utils.test.ts
git commit -m "test: add Vitest with tsconfig-paths, cover formatTime12Hour"
```

---

### Task 3: Shared typed errors and API error handler

**Files:**
- Create: `lib/errors.ts`
- Create: `lib/errors.test.ts`
- Create: `lib/handle-api-error.ts`
- Create: `lib/handle-api-error.test.ts`

**Interfaces:**
- Produces: `AppError`, `NotFoundError`, `ForbiddenError`, `ValidationError`, `UnauthorizedError` (all from `lib/errors.ts`, each with a `.status: number` property) and `handleApiError(error: unknown): NextResponse` (from `lib/handle-api-error.ts`). Every later feature plan's route handlers import and use these instead of ad hoc try/catch.

- [ ] **Step 1: Write the failing tests for the error classes**

Create `lib/errors.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  AppError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "./errors";

describe("AppError", () => {
  it("carries a message and status", () => {
    const err = new AppError("custom", 418);
    expect(err.message).toBe("custom");
    expect(err.status).toBe(418);
    expect(err).toBeInstanceOf(Error);
  });
});

describe("NotFoundError", () => {
  it("defaults to 404 with a generic message", () => {
    const err = new NotFoundError();
    expect(err.status).toBe(404);
    expect(err.message).toBe("Not found");
  });

  it("accepts a custom message", () => {
    const err = new NotFoundError("Trip not found");
    expect(err.message).toBe("Trip not found");
    expect(err.status).toBe(404);
  });
});

describe("ForbiddenError", () => {
  it("defaults to 403", () => {
    expect(new ForbiddenError().status).toBe(403);
  });
});

describe("ValidationError", () => {
  it("defaults to 400", () => {
    expect(new ValidationError().status).toBe(400);
  });
});

describe("UnauthorizedError", () => {
  it("defaults to 401", () => {
    expect(new UnauthorizedError().status).toBe(401);
  });

  it("accepts a custom message", () => {
    const err = new UnauthorizedError("Incorrect current password");
    expect(err.message).toBe("Incorrect current password");
    expect(err.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- lib/errors.test.ts`
Expected: FAIL with "Cannot find module './errors'" (the file doesn't exist yet).

- [ ] **Step 3: Implement the error classes**

Create `lib/errors.ts`:

```ts
export class AppError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = new.target.name;
    this.status = status;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, 404);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid request") {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test -- lib/errors.test.ts`
Expected: PASS — 8 tests passed.

- [ ] **Step 5: Write the failing tests for `handleApiError`**

Create `lib/handle-api-error.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { NotFoundError } from "./errors";
import { handleApiError } from "./handle-api-error";

vi.mock("./logger", () => ({
  logger: { error: vi.fn() },
}));

describe("handleApiError", () => {
  it("maps a ZodError to 400 with issues", async () => {
    const schema = z.object({ name: z.string() });
    const result = schema.safeParse({ name: 123 });
    if (result.success) throw new Error("expected parse failure");

    const response = handleApiError(result.error);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid request");
    expect(body.issues).toBeDefined();
  });

  it("maps an AppError subclass to its own status and message", async () => {
    const response = handleApiError(new NotFoundError("Trip not found"));
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Trip not found");
  });

  it("maps an unknown error to a generic 500 without leaking the message", async () => {
    const response = handleApiError(new Error("db connection string leaked here"));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Internal server error");
    expect(JSON.stringify(body)).not.toContain("leaked");
  });
});
```

- [ ] **Step 6: Run the tests to verify they fail**

Run: `npm run test -- lib/handle-api-error.test.ts`
Expected: FAIL with "Cannot find module './handle-api-error'".

- [ ] **Step 7: Implement `handleApiError`**

Create `lib/handle-api-error.ts`:

```ts
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./errors";
import { logger } from "./logger";

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Invalid request", issues: error.flatten() },
      { status: 400 },
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  logger.error("Unhandled API error", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `npm run test -- lib/handle-api-error.test.ts`
Expected: PASS — 3 tests passed.

- [ ] **Step 9: Run the full test suite**

Run: `npm run test`
Expected: PASS — all tests across `lib/utils.test.ts`, `lib/errors.test.ts`, `lib/handle-api-error.test.ts` pass.

- [ ] **Step 10: Commit**

```bash
git add lib/errors.ts lib/errors.test.ts lib/handle-api-error.ts lib/handle-api-error.test.ts
git commit -m "feat: add shared typed errors and handleApiError for API routes"
```

---

### Task 4: CI checks workflow

**Files:**
- Create: `.github/workflows/checks.yml`
- Modify: `package.json` (add `build:ci` script)

**Interfaces:**
- Produces: a `build:ci` npm script (schema generation + Next build, no live database required) used only by CI, leaving the real `build` script (which runs `prisma migrate deploy` against the real database) untouched for actual deploys.

- [ ] **Step 1: Add a CI-safe build script**

The existing `build` script runs `prisma generate && prisma migrate deploy && next build --turbopack`. `prisma migrate deploy` requires a live, reachable database and applies migrations — not appropriate for a PR check. Add a separate script that only generates the client and builds, without migrating a real database.

In `package.json` `"scripts"`, add:

```json
"build:ci": "prisma generate && next build --turbopack"
```

- [ ] **Step 2: Verify `build:ci` works locally with a dummy DATABASE_URL**

`prisma generate` only reads `prisma/schema.prisma` — it doesn't need a reachable database, but Prisma does require `DATABASE_URL` to be a syntactically valid URL in the environment.

Run: `DATABASE_URL="postgresql://ci:ci@localhost:5432/ci" npm run build:ci`
Expected: succeeds — Prisma client generates and `next build` completes without connecting to a real database.

If this fails because some other env var is read at build time (e.g. a module that throws if `FIREBASE_PROJECT_ID` is undefined), note exactly which var and add a dummy value for it in Step 3's workflow env block — do not weaken the source code's validation to make the build pass.

- [ ] **Step 3: Create the workflow**

Create `.github/workflows/checks.yml`:

```yaml
name: Checks

on:
  pull_request:
    branches:
      - dev
      - prod

jobs:
  checks:
    runs-on: ubuntu-latest
    env:
      DATABASE_URL: "postgresql://ci:ci@localhost:5432/ci"
      DATABASE_URL_UNPOOLED: "postgresql://ci:ci@localhost:5432/ci"
      FIREBASE_PROJECT_ID: "ci-project"
      FIREBASE_CLIENT_EMAIL: "ci@ci-project.iam.gserviceaccount.com"
      FIREBASE_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\nci\n-----END PRIVATE KEY-----\n"
      NEXT_PUBLIC_FIREBASE_API_KEY: "ci-key"
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "ci.firebaseapp.com"
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "ci-project"
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "ci.appspot.com"
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "000000000000"
      NEXT_PUBLIC_FIREBASE_APP_ID: "1:000000000000:web:ci"
      CLOUDINARY_API_KEY: "ci"
      CLOUDINARY_API_SECRET: "ci"
      NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: "ci"
      ADMIN_PASSWORD: "ci-placeholder"
      NEXT_PUBLIC_SOCKET_URL: "http://localhost:8080"
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - run: npm run lint

      - run: npm run test

      - run: npm run build:ci
```

- [ ] **Step 4: Validate the YAML is well-formed**

Run: `python3 -c "import yaml, sys; yaml.safe_load(open('.github/workflows/checks.yml'))" && echo "valid YAML"`
Expected: prints `valid YAML` with no exception.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/checks.yml package.json
git commit -m "ci: add lint/test/build checks workflow for pull requests"
```

- [ ] **Step 6: Push and confirm the workflow actually runs**

```bash
git push -u origin refactor/foundation-infra
gh pr create --base dev --head refactor/foundation-infra \
  --title "chore: foundation infra for code cleanup (repo hygiene, errors, Vitest, CI checks)" \
  --body "Repo hygiene (dead dirs, stray files), shared typed-error/handleApiError utilities for API routes, Vitest setup, and a new CI checks workflow (lint+test+build) — prerequisite infra for the feature-by-feature service/repository migration in docs/superpowers/specs/2026-09-22-code-cleanup-design.md. No AI attribution per CLAUDE.md."
gh pr checks --watch
```

Expected: the `checks` workflow appears on the PR and passes (lint, test, build:ci all green). If it fails, read the failure, fix the underlying issue (not by weakening a check), and push a follow-up commit — do not merge with a failing check.

---

## Definition of Done

- [ ] `src/components/` and `src/lib/` no longer exist.
- [ ] `repro_delete.ts` lives at `scripts/repro-delete.ts`; `234271951.png` is gone.
- [ ] `.cursorrules` and `AI_CONTEXT.md` point to `CLAUDE.md` as authoritative.
- [ ] `npm run test` runs Vitest and passes.
- [ ] `lib/errors.ts` and `lib/handle-api-error.ts` exist, are tested, and don't leak internal error messages to clients on unexpected errors.
- [ ] `.github/workflows/checks.yml` exists and is green on the PR that introduces it.
- [ ] `npm run build` (the real, unmodified script) still succeeds — this task changed no runtime behavior.
