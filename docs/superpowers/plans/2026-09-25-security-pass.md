# Security Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the shared admin password, replace raw-group-code guest access with signed tokens, add real rate limiting, delete the gateway proxy, narrow member permissions, and add baseline hardening.

**Architecture:** Auth stays in the existing wrappers (`lib/auth/with-auth.ts`) and the admin `assertAdmin` guard, so route handlers and most services are untouched. New pure modules (`lib/auth/admin.ts`, `lib/auth/guest-token.ts`, `lib/security-headers.ts`, `src/app/api/groups/permissions.ts`) carry the logic and are unit-tested; wrappers and services call them. Work ships as seven PRs, each merged into `dev` and pulled before the next starts.

**Tech Stack:** Next.js 15 App Router, Firebase Admin, Prisma 6, Zod 4, Vitest 5, `@upstash/ratelimit` + `@upstash/redis` (added in Part 2), `node:crypto` HMAC (no new dependency for tokens).

**Spec:** `docs/superpowers/specs/2026-09-25-security-pass-design.md`

## Global Constraints

- No AI/Claude attribution in commit messages or PR descriptions (`CLAUDE.md`).
- Do not run `npm install`, `npm audit fix`, `prisma migrate`, or change `.env`; when a step needs one, STOP and give the maintainer the exact command (steps marked **MAINTAINER**).
- New env vars, exact names: `ADMIN_EMAILS` (comma-separated), `GUEST_TOKEN_SECRET` (32+ random bytes), `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`. Retired: `ADMIN_PASSWORD`, `NEXT_PUBLIC_ENABLE_GATEWAY`.
- Guest token TTL: 24 hours. Rate-limit values: `validate-code` 10/min, `guest-join` 20/min, `reviews` 10/hour, `admin-signin` 10 per 10 min.
- Rate limiter fails **open** (log, allow) when Redis is unset or unreachable.
- Auth failures keep the existing response shape `{ message: string }` with status 401; API errors elsewhere keep `{ error: string }` via `handleApiError`.
- One PR per Part, based on `dev`, branch names as given. After each PR: wait for the `checks` workflow to pass, merge **only that PR by number** (never the automatic dev→prod promotion PR), then `git checkout dev && git pull --ff-only` before starting the next Part.
- Baseline before every Part: `npm run lint` (0 errors; the warning count must not increase), `npx tsc --noEmit` (0 errors), `npm run test` (all pass). Tests are colocated `*.test.ts`; mock modules with `vi.mock` + dynamic `await import(...)` exactly as neighbouring tests do.

## File Structure

| Path | Part | Responsibility |
|---|---|---|
| `lib/auth/with-auth.ts` (modify) | 1, 5 | Token verification (with revocation check), guest token context, handler errors no longer masked as 401 |
| `lib/security-headers.ts` (create) | 1 | Builds the security header list and the report-only CSP |
| `next.config.ts` (modify) | 1 | Applies headers; removes the gateway rewrite |
| `.env.example` (create) | 1 | Documents every env var |
| `lib/rate-limit.ts` (rewrite) | 2 | Upstash limiter: `limit()`, `withRateLimit()`, `getClientIP()` |
| `lib/auth/admin.ts` (create) | 3 | `parseAdminEmails`, `isAdminEmail` |
| `src/app/api/admin/guard.ts` (modify) | 3, 4 | `assertAdmin(req)` → `{ adminEmail }`; dual mode then Firebase-only |
| `src/app/api/admin/audit.ts` (create) | 3 | `auditAdminAction` structured log |
| `src/app/api/admin/me/route.ts` (create) | 3 | Rate-limited "am I admin" check used by the admin UI |
| `src/app/admin/*` (modify) | 3, 4 | Admin UI on Firebase sign-in; legacy password fallback removed in Part 4 |
| `lib/auth/guest-token.ts` (create) | 5 | Sign/verify guest tokens |
| `src/app/api/groups/permissions.ts` (create) | 6 | `canModify` / `assertCanModify` |

---

# Part 1: Gateway removal, auth wrapper fixes, headers, env template

Branch: `security/foundation`

### Task 1.1: Remove the gateway

**Files:**
- Delete: `src/app/api/v1/gateway/route.ts` (and the now-empty `src/app/api/v1/` tree)
- Modify: `lib/axios.ts`, `next.config.ts`, `lib/rate-limit.ts`, `CLAUDE.md`, `API_REFERENCE.md`, `.agent/architecture.md`, `.agent/instructions.md`, `docs/superpowers/specs/2026-09-22-code-cleanup-design.md`

**Interfaces:**
- Produces: `api` (axios instance in `lib/axios.ts`) that always calls `/api/...` directly; no more `gatewayRateLimiter` export.

- [ ] **Step 1: Delete the route**

```bash
git rm -r src/app/api/v1
```

- [ ] **Step 2: Remove the rewrite.** Replace the whole `next.config.ts` body's `rewrites` block so the file becomes:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 3: Remove the gateway branch from `lib/axios.ts`.** Delete the `isGatewayEnabled` constant and the `if (isGatewayEnabled && ...) { ... }` block. The interceptor must begin:

```ts
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getToken();
```

(the rest of the interceptor is unchanged).

- [ ] **Step 4: Remove `gatewayRateLimiter`** from `lib/rate-limit.ts`: delete the two lines

```ts
// Create a singleton instance for the API Gateway (100 requests per minute)
export const gatewayRateLimiter = new RateLimiter(100, 60 * 1000);
```

- [ ] **Step 5: Purge references and confirm none remain**

Run: `grep -rn "gateway\|Gateway\|wanderly-api\|ENABLE_GATEWAY" src lib next.config.ts CLAUDE.md API_REFERENCE.md AI_CONTEXT.md .agent README.md`
Edit each hit: delete the gateway sections from `API_REFERENCE.md`, `.agent/architecture.md`, `.agent/instructions.md`; in `.agent/instructions.md` change "Always use `lib/axios.ts` for API calls to ensure gateway/auth headers are handled" to "...to ensure auth headers are handled"; delete the gateway bullet from `CLAUDE.md` (the line beginning "The `/api/v1/gateway` proxy"); in the cleanup spec change the `v1 Gateway` row status to `Removed in the security pass`.
Expected: the grep above prints nothing (old plan/spec docs under `docs/superpowers/` are historical and stay).

- [ ] **Step 6: Verify and commit**

Run: `npx tsc --noEmit && npm run lint && npm run test`
Expected: 0 type errors, 0 lint errors, all tests pass.

```bash
git add -A
git commit -m "security: remove the API gateway proxy and its rewrite"
```

### Task 1.2: `withAuth` — revocation check and honest errors

**Files:**
- Modify: `lib/auth/with-auth.ts`
- Test: `lib/auth/with-auth.test.ts`

**Interfaces:**
- Consumes: `handleApiError` (`lib/handle-api-error.ts`), `userAuth` (`lib/firebase-admin.ts`).
- Produces: unchanged exports (`withAuth`, `withOptionalAuth`, `withBasicAuth`, `AuthContext`, `OptionalAuthContext`, `RouteContext`). Behavior: `verifyIdToken(token, true)`; a throwing handler is converted by `handleApiError` instead of becoming a 401.

- [ ] **Step 1: Write the failing tests.** Append to `lib/auth/with-auth.test.ts` (keep the existing tests; add this import near the top: `import { AppError } from "../errors";`):

```ts
describe("withAuth token verification", () => {
  it("asks Firebase to check for revoked tokens", async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: "user-1" });
    const wrapped = withAuth(vi.fn().mockResolvedValue(NextResponse.json(null)));

    await wrapped(makeRequest({ Authorization: "Bearer token123" }));

    expect(mockVerifyIdToken).toHaveBeenCalledWith("token123", true);
  });

  it("returns 401 'Token has been revoked' for a revoked or disabled account", async () => {
    mockVerifyIdToken.mockRejectedValue(
      Object.assign(new Error("The Firebase ID token has been revoked."), {
        code: "auth/id-token-revoked",
      }),
    );
    const handler = vi.fn();

    const response = await withAuth(handler)(makeRequest({ Authorization: "Bearer t" }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: "Token has been revoked" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns 401 'Invalid or expired token' for an expired token", async () => {
    mockVerifyIdToken.mockRejectedValue(
      Object.assign(new Error("expired"), { code: "auth/id-token-expired" }),
    );

    const response = await withAuth(vi.fn())(makeRequest({ Authorization: "Bearer t" }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: "Invalid or expired token" });
  });
});

describe("withAuth handler errors", () => {
  it("does not report an error thrown by the handler as a 401", async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: "user-1" });
    const wrapped = withAuth(vi.fn().mockRejectedValue(new AppError("teapot", 418)));

    const response = await wrapped(makeRequest({ Authorization: "Bearer t" }));

    expect(response.status).toBe(418);
    expect(await response.json()).toEqual({ error: "teapot" });
  });

  it("turns an unexpected handler error into a generic 500", async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: "user-1" });
    const wrapped = withAuth(vi.fn().mockRejectedValue(new Error("db exploded")));

    const response = await wrapped(makeRequest({ Authorization: "Bearer t" }));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal server error" });
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm run test -- lib/auth/with-auth.test.ts`
Expected: FAIL — `verifyIdToken` was called without `true`; revoked/expired mapping and 418/500 assertions fail.

- [ ] **Step 3: Implement.** Replace `lib/auth/with-auth.ts` down to (but not including) the `withOptionalAuth` doc comment with the following, and update `withOptionalAuth`'s `verifyIdToken(token)` call to `verifyIdToken(token, CHECK_REVOKED)` (leave its guest logic as is; Part 5 changes it):

```ts
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { handleApiError } from "@/lib/handle-api-error";
import { DecodedIdToken } from "firebase-admin/auth";
import { User } from "@prisma/client";
import { userAuth } from "../firebase-admin";

/**
 * Reject tokens of revoked or disabled accounts immediately instead of when the token expires
 * (~1h). Costs one extra Firebase lookup per request; flip to false to fall back to local
 * signature/expiry verification only.
 */
const CHECK_REVOKED = true;

export interface AuthContext {
  uid: string;
  email?: string;
  emailVerified?: boolean;
  decodedToken: DecodedIdToken;
  user?: User;
}

export interface RouteContext<
  Params extends Record<string, string> = Record<string, string>,
> {
  params: Promise<Params>;
}

function authErrorResponse(error: unknown): NextResponse {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";

  if (code === "auth/id-token-revoked" || code === "auth/user-disabled") {
    return NextResponse.json({ message: "Token has been revoked" }, { status: 401 });
  }
  if (code === "auth/id-token-expired" || (error instanceof Error && /token/i.test(error.message))) {
    return NextResponse.json({ message: "Invalid or expired token" }, { status: 401 });
  }
  return NextResponse.json({ message: "Authentication failed" }, { status: 401 });
}

/**
 * Higher-order function that wraps API route handlers with Firebase auth validation.
 * Authentication failures are 401s; anything the handler itself throws is mapped by
 * handleApiError (so a database error is a 500, not a 401).
 */
export function withAuth<
  Params extends Record<string, string> = Record<string, string>,
>(
  handler: (
    req: NextRequest,
    context: AuthContext,
    routeContext: RouteContext<Params>,
  ) => Promise<NextResponse>,
) {
  return async (
    req: NextRequest,
    routeContext?: RouteContext<Params>,
  ): Promise<NextResponse> => {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    if (!token) {
      return NextResponse.json({ message: "No token provided" }, { status: 401 });
    }

    if (!userAuth) {
      logger.error("Firebase Admin not initialized");
      return NextResponse.json(
        { message: "Authentication service unavailable" },
        { status: 503 },
      );
    }

    let decodedToken: DecodedIdToken;
    try {
      decodedToken = await userAuth.verifyIdToken(token, CHECK_REVOKED);
    } catch (error) {
      logger.warn("Auth validation failed", { error });
      return authErrorResponse(error);
    }

    const authContext: AuthContext = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      decodedToken,
    };

    logger.info("Auth validation successful", {
      uid: decodedToken.uid,
      path: req.nextUrl.pathname,
    });

    try {
      return await handler(req, authContext, routeContext as RouteContext<Params>);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

export function withBasicAuth(
  handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>,
) {
  return withAuth(handler);
}
```

Also delete the trailing commented-out `withAdminAuth`/`withRoleAuth` blocks at the bottom of the file.

- [ ] **Step 4: Run tests**

Run: `npm run test -- lib/auth/with-auth.test.ts`
Expected: PASS (old and new tests).

- [ ] **Step 5: Full verification and commit**

Run: `npx tsc --noEmit && npm run lint && npm run test`

```bash
git add lib/auth/with-auth.ts lib/auth/with-auth.test.ts
git commit -m "security: check token revocation and stop masking handler errors as 401"
```

### Task 1.3: Security headers

**Files:**
- Create: `lib/security-headers.ts`, `lib/security-headers.test.ts`
- Modify: `next.config.ts`

**Interfaces:**
- Produces: `securityHeaders(env?: { socketUrl?: string }): { key: string; value: string }[]`.

- [ ] **Step 1: Write the failing test** (`lib/security-headers.test.ts`):

```ts
import { describe, expect, it } from "vitest";
import { securityHeaders } from "./security-headers";

const byKey = (headers: { key: string; value: string }[]) =>
  Object.fromEntries(headers.map((h) => [h.key, h.value]));

describe("securityHeaders", () => {
  it("sets the baseline hardening headers", () => {
    const h = byKey(securityHeaders());

    expect(h["X-Content-Type-Options"]).toBe("nosniff");
    expect(h["X-Frame-Options"]).toBe("DENY");
    expect(h["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["Strict-Transport-Security"]).toContain("max-age=");
    expect(h["Permissions-Policy"]).toContain("camera=()");
  });

  it("ships the CSP as report-only so nothing breaks while it is tuned", () => {
    const h = byKey(securityHeaders());

    expect(h["Content-Security-Policy-Report-Only"]).toBeDefined();
    expect(h["Content-Security-Policy"]).toBeUndefined();
  });

  it("allows Cloudinary images and forbids framing and plugins", () => {
    const csp = byKey(securityHeaders())["Content-Security-Policy-Report-Only"];

    expect(csp).toContain("img-src 'self' data: blob: https://res.cloudinary.com");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
  });

  it("adds the socket origin to connect-src when configured", () => {
    const csp = byKey(securityHeaders({ socketUrl: "https://socket.example.com" }))[
      "Content-Security-Policy-Report-Only"
    ];

    expect(csp).toContain("https://socket.example.com");
    expect(csp).toContain("wss://socket.example.com");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test -- lib/security-headers.test.ts`
Expected: FAIL — cannot find module `./security-headers`.

- [ ] **Step 3: Implement** `lib/security-headers.ts`:

```ts
interface HeaderEnv {
  socketUrl?: string;
}

function socketSources(socketUrl?: string): string[] {
  if (!socketUrl) return [];
  try {
    const { protocol, host } = new URL(socketUrl);
    const ws = protocol === "https:" ? "wss:" : "ws:";
    return [`${protocol}//${host}`, `${ws}//${host}`];
  } catch {
    return [];
  }
}

/**
 * Content-Security-Policy in REPORT-ONLY mode: violations show up in the browser console but
 * nothing is blocked. Switch the header name to Content-Security-Policy once it is quiet.
 */
function contentSecurityPolicy(env: HeaderEnv): string {
  const connect = [
    "'self'",
    "https://*.googleapis.com",
    "https://*.firebaseio.com",
    "wss://*.firebaseio.com",
    ...socketSources(env.socketUrl),
  ];

  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com",
    `connect-src ${connect.join(" ")}`,
    "frame-src https://*.firebaseapp.com https://accounts.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

export function securityHeaders(
  env: HeaderEnv = { socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL },
): { key: string; value: string }[] {
  return [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
    { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy(env) },
  ];
}
```

- [ ] **Step 4: Wire it into `next.config.ts`.** Add `import { securityHeaders } from "./lib/security-headers";` at the top and inside `nextConfig` (after `images`):

```ts
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders() }];
  },
```

- [ ] **Step 5: Run tests**

Run: `npm run test -- lib/security-headers.test.ts && npx tsc --noEmit`
Expected: PASS, 0 type errors.

- [ ] **Step 6: Commit**

```bash
git add lib/security-headers.ts lib/security-headers.test.ts next.config.ts
git commit -m "security: add baseline security headers and a report-only CSP"
```

### Task 1.4: `.env.example` and ship Part 1

**Files:**
- Create: `.env.example`
- Modify: `CLAUDE.md` (Environment Variables section)

- [ ] **Step 1: Create `.env.example`** (placeholders only, no real values):

```bash
# --- Database (Neon/Postgres) ---
DATABASE_URL=
DATABASE_URL_UNPOOLED=

# --- Firebase (client, browser-exposed) ---
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# --- Firebase Admin (server only) ---
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# --- Cloudinary ---
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# --- Realtime ---
NEXT_PUBLIC_SOCKET_URL=

# --- Admin access (Part 3) ---
# Comma-separated emails allowed into /admin. They must sign in with a VERIFIED Firebase account.
ADMIN_EMAILS=

# --- Guest access (Part 5) ---
# 32+ random bytes, e.g. `openssl rand -base64 32`. Changing it signs every guest out.
GUEST_TOKEN_SECRET=

# --- Rate limiting (Part 2), from your Upstash Redis database's REST API section ---
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Cross-check against `.env` locally (`sed 's/=.*//' .env | sort`) and add any Firebase/Cloudinary variable names the app reads that are missing above (never copy values).

- [ ] **Step 2: Update `CLAUDE.md`.** In "Environment Variables", replace the sentence "No `.env.example` currently exists — `.env` (gitignored, present locally) is the only reference for required vars:" with "`.env.example` lists every required variable (copy it to `.env`); real values live only in `.env` (gitignored) and the hosting dashboard. Categories:". Delete the sentence "If you add a required var, create a `.env.example` with placeholder values rather than leaving `.env` as the only source of truth." and replace with "When you add a required variable, add it to `.env.example` in the same PR."

- [ ] **Step 3: Verify, commit, ship**

Run: `npx tsc --noEmit && npm run lint && npm run test`

```bash
git add .env.example CLAUDE.md
git commit -m "docs: add .env.example and document the environment template"
git push -u origin security/foundation
gh pr create --base dev --title "security: remove gateway, fix auth wrapper, add headers and .env.example" --body "<what changed and why: gateway removal (stale tabs need a reload), withAuth now checks revocation (measure latency after deploy; CHECK_REVOKED constant narrows it) and no longer reports handler errors as 401, report-only CSP + baseline headers, .env.example. No live QA possible in the sandbox; list: sign in, load a group, create an expense, confirm the browser console shows no CSP violations that matter.>"
```

Then poll `gh pr checks <n>` until `checks` passes, `gh pr merge <n> --merge`, `git checkout dev && git pull --ff-only`.

---

# Part 2: Rate limiting on Upstash

Branch: `security/rate-limiting`

### Task 2.0: MAINTAINER prerequisites (STOP gate)

- [ ] **Step 1:** Ask the maintainer to (a) create an Upstash Redis database, (b) set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in `.env` and the hosting dashboard, (c) run `npm i @upstash/ratelimit @upstash/redis`. Do not continue until `ls node_modules/@upstash/ratelimit` succeeds.

### Task 2.1: Limiter module

**Files:**
- Rewrite: `lib/rate-limit.ts`
- Create: `lib/rate-limit.test.ts`

**Interfaces:**
- Produces:
  - `type LimiterName = "validate-code" | "guest-join" | "reviews" | "admin-signin"`
  - `interface LimitResult { allowed: boolean; remaining: number; resetTime: number }` (`resetTime` = epoch ms)
  - `limit(name: LimiterName, key: string): Promise<LimitResult>`
  - `getClientIP(request: Request): string`
  - `withRateLimit<A extends unknown[]>(name: LimiterName, handler: (req: NextRequest, ...rest: A) => Promise<NextResponse>): (req: NextRequest, ...rest: A) => Promise<NextResponse>`

- [ ] **Step 1: Write the failing tests** (`lib/rate-limit.test.ts`):

```ts
import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockLimit = vi.fn();
const constructed = vi.fn();

vi.mock("@upstash/redis", () => ({ Redis: class {} }));
vi.mock("@upstash/ratelimit", () => {
  class Ratelimit {
    constructor(options: unknown) {
      constructed(options);
    }
    limit = (...a: unknown[]) => mockLimit(...a);
    static slidingWindow = (requests: number, window: string) => ({ requests, window });
  }
  return { Ratelimit };
});
vi.mock("./logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

const importFresh = async () => {
  vi.resetModules();
  return import("./rate-limit");
};

const req = (headers: Record<string, string> = {}) =>
  new NextRequest("http://localhost/api/x", { method: "POST", headers });

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
});

describe("limit", () => {
  it("fails open without touching Redis when the env vars are unset", async () => {
    const { limit } = await importFresh();

    const result = await limit("validate-code", "1.2.3.4");

    expect(result.allowed).toBe(true);
    expect(constructed).not.toHaveBeenCalled();
  });

  describe("with Redis configured", () => {
    beforeEach(() => {
      process.env.UPSTASH_REDIS_REST_URL = "https://redis.example.com";
      process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    });

    it("blocks when the sliding window is exhausted", async () => {
      mockLimit.mockResolvedValue({ success: false, remaining: 0, reset: 1234 });
      const { limit } = await importFresh();

      expect(await limit("validate-code", "1.2.3.4")).toEqual({
        allowed: false,
        remaining: 0,
        resetTime: 1234,
      });
      expect(mockLimit).toHaveBeenCalledWith("1.2.3.4");
    });

    it("configures each limiter with its own window and prefix", async () => {
      mockLimit.mockResolvedValue({ success: true, remaining: 9, reset: 1 });
      const { limit } = await importFresh();

      await limit("validate-code", "k");
      await limit("reviews", "k");

      expect(constructed).toHaveBeenCalledWith(
        expect.objectContaining({
          limiter: { requests: 10, window: "1 m" },
          prefix: "wanderly:validate-code",
        }),
      );
      expect(constructed).toHaveBeenCalledWith(
        expect.objectContaining({
          limiter: { requests: 10, window: "1 h" },
          prefix: "wanderly:reviews",
        }),
      );
    });

    it("fails open when Redis errors", async () => {
      mockLimit.mockRejectedValue(new Error("redis down"));
      const { limit } = await importFresh();

      expect((await limit("guest-join", "k")).allowed).toBe(true);
    });
  });
});

describe("getClientIP", () => {
  it("uses the first x-forwarded-for hop, then x-real-ip, then 'unknown'", async () => {
    const { getClientIP } = await importFresh();

    expect(getClientIP(req({ "x-forwarded-for": "9.9.9.9, 10.0.0.1" }))).toBe("9.9.9.9");
    expect(getClientIP(req({ "x-real-ip": "8.8.8.8" }))).toBe("8.8.8.8");
    expect(getClientIP(req())).toBe("unknown");
  });
});

describe("withRateLimit", () => {
  beforeEach(() => {
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.example.com";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
  });

  it("returns 429 with Retry-After and skips the handler when blocked", async () => {
    mockLimit.mockResolvedValue({ success: false, remaining: 0, reset: Date.now() + 30_000 });
    const { withRateLimit } = await importFresh();
    const handler = vi.fn();

    const response = await withRateLimit("validate-code", handler)(req({ "x-forwarded-for": "1.1.1.1" }));

    expect(response.status).toBe(429);
    expect(Number(response.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(handler).not.toHaveBeenCalled();
  });

  it("passes the request and extra arguments through when allowed", async () => {
    mockLimit.mockResolvedValue({ success: true, remaining: 5, reset: Date.now() + 1000 });
    const { withRateLimit } = await importFresh();
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const extra = { params: Promise.resolve({}) };

    const response = await withRateLimit("validate-code", handler)(req(), extra);

    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledWith(expect.anything(), extra);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test -- lib/rate-limit.test.ts`
Expected: FAIL — `limit`/`withRateLimit` are not exported.

- [ ] **Step 3: Implement** — replace `lib/rate-limit.ts` entirely:

```ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "./logger";

const LIMITERS = {
  "validate-code": { requests: 10, window: "1 m" },
  "guest-join": { requests: 20, window: "1 m" },
  reviews: { requests: 10, window: "1 h" },
  "admin-signin": { requests: 10, window: "10 m" },
} as const;

export type LimiterName = keyof typeof LIMITERS;

export interface LimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

const OPEN: LimitResult = { allowed: true, remaining: Number.MAX_SAFE_INTEGER, resetTime: 0 };

let redis: Redis | null | undefined;
const limiters = new Map<LimiterName, Ratelimit>();

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  redis = url && token ? new Redis({ url, token }) : null;
  if (!redis) {
    logger.warn("Rate limiting disabled: UPSTASH_REDIS_REST_URL/TOKEN are not set");
  }
  return redis;
}

function getLimiter(name: LimiterName): Ratelimit | null {
  const existing = limiters.get(name);
  if (existing) return existing;

  const client = getRedis();
  if (!client) return null;

  const { requests, window } = LIMITERS[name];
  const limiter = new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix: `wanderly:${name}`,
  });
  limiters.set(name, limiter);
  return limiter;
}

/**
 * Counts one attempt for `key` against the named limiter. Fails OPEN (allows the request and
 * logs) if Redis is not configured or errors: an outage of the limiter must not take the app down.
 */
export async function limit(name: LimiterName, key: string): Promise<LimitResult> {
  const limiter = getLimiter(name);
  if (!limiter) return OPEN;

  try {
    const result = await limiter.limit(key);
    return { allowed: result.success, remaining: result.remaining, resetTime: result.reset };
  } catch (error) {
    logger.error("Rate limiter failed, allowing request", { name, error });
    return OPEN;
  }
}

/**
 * Get client IP address from request. x-forwarded-for is set by the hosting proxy (Vercel);
 * behind an untrusted proxy it can be spoofed.
 */
export function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const ips = forwardedFor.split(",").map((ip) => ip.trim());
    return ips[0] || "unknown";
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  return "unknown";
}

/** Wraps a route handler so requests over the named limit get a 429 before the handler runs. */
export function withRateLimit<A extends unknown[]>(
  name: LimiterName,
  handler: (req: NextRequest, ...rest: A) => Promise<NextResponse>,
) {
  return async (req: NextRequest, ...rest: A): Promise<NextResponse> => {
    const ip = getClientIP(req);
    const result = await limit(name, ip);

    if (!result.allowed) {
      logger.warn("Rate limit exceeded", { name, ip });
      const retryAfter = Math.max(1, Math.ceil((result.resetTime - Date.now()) / 1000));
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          resetTime: result.resetTime,
        },
        { status: 429, headers: { "Retry-After": retryAfter.toString() } },
      );
    }

    return handler(req, ...rest);
  };
}
```

- [ ] **Step 4: Run tests**

Run: `npm run test -- lib/rate-limit.test.ts`
Expected: PASS (8 tests). Then `npx tsc --noEmit` will show errors in `src/app/api/reviews/route.ts` (removed exports) — fixed in Task 2.2.

- [ ] **Step 5: Commit**

```bash
git add lib/rate-limit.ts lib/rate-limit.test.ts
git commit -m "security: rebuild rate limiting on Upstash Redis (fails open)"
```

### Task 2.2: Apply the limiter

**Files:**
- Modify: `src/app/api/reviews/route.ts`, `src/app/api/groups/validate-code/route.ts`, `src/app/api/groups/join/route.ts`

**Interfaces:**
- Consumes: `withRateLimit`, `limit`, `getClientIP` from Task 2.1.

- [ ] **Step 1: Reviews.** In `src/app/api/reviews/route.ts` change the import to `import { getClientIP, limit } from "@/lib/rate-limit";` and replace the block from `const rateLimitResult = reviewsRateLimiter.check(clientIP);` down to the end of the `if (!rateLimitResult.allowed) { ... }` with:

```ts
    const rateLimitResult = await limit("reviews", clientIP);
    if (!rateLimitResult.allowed) {
      logger.warn("Rate limit exceeded", {
        ip: clientIP,
        resetTime: new Date(rateLimitResult.resetTime).toISOString(),
      });
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          resetTime: rateLimitResult.resetTime,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
            "Retry-After": Math.max(
              1,
              Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
            ).toString(),
          },
        },
      );
    }
```

and in the 201 response headers drop `"X-RateLimit-Limit": "3"` (the limit is 10/hour and the header was wrong).

- [ ] **Step 2: `validate-code`.** In `src/app/api/groups/validate-code/route.ts` add `import { withRateLimit } from "@/lib/rate-limit";`, change `export async function POST(req: NextRequest) {` to `async function handler(req: NextRequest) {`, and append at the bottom:

```ts
export const POST = withRateLimit("validate-code", handler);
```

- [ ] **Step 3: `join`.** In `src/app/api/groups/join/route.ts` add `import { withRateLimit } from "@/lib/rate-limit";` and replace the last line `export const POST = withAuth(handler);` with:

```ts
export const POST = withRateLimit("guest-join", withAuth(handler));
```

- [ ] **Step 4: Verify and ship Part 2**

Run: `npx tsc --noEmit && npm run lint && npm run test`
Expected: all green.

```bash
git add -A
git commit -m "security: rate-limit review posts, group code validation and group joins"
git push -u origin security/rate-limiting
gh pr create --base dev --title "security: real rate limiting (Upstash) on public and guessable endpoints" --body "<summary; note the 3 manual prerequisites already done (Upstash DB, env vars, npm i); fails open; QA: post a review, hit validate-code >10 times/min and see the 429 with Retry-After, confirm normal use is unaffected>"
```

Poll checks, merge that PR, `git checkout dev && git pull --ff-only`.

---

# Part 3: Admin on Firebase sign-in (dual mode)

Branch: `security/admin-firebase`

### Task 3.0: MAINTAINER prerequisite (STOP gate)

- [ ] **Step 1:** Ask the maintainer to set `ADMIN_EMAILS` (their verified Firebase account email, comma-separated for several) in `.env` and the hosting dashboard **for every environment** before this PR deploys. Confirm before continuing.

### Task 3.1: Allowlist helpers

**Files:**
- Create: `lib/auth/admin.ts`, `lib/auth/admin.test.ts`

**Interfaces:**
- Produces:
  - `parseAdminEmails(raw: string | undefined): Set<string>` (lower-cased, trimmed, empty entries dropped)
  - `isAdminEmail(email: string | undefined, emailVerified: boolean | undefined, allowlist?: Set<string>): boolean` — true only when `emailVerified === true` and the lower-cased email is in the allowlist (defaults to `parseAdminEmails(process.env.ADMIN_EMAILS)`)

- [ ] **Step 1: Write the failing tests:**

```ts
import { describe, expect, it } from "vitest";
import { isAdminEmail, parseAdminEmails } from "./admin";

describe("parseAdminEmails", () => {
  it("splits on commas, trims, lower-cases and drops empties", () => {
    expect([...parseAdminEmails(" A@x.com, b@X.com ,, ")]).toEqual(["a@x.com", "b@x.com"]);
  });

  it("returns an empty set for undefined or blank input", () => {
    expect(parseAdminEmails(undefined).size).toBe(0);
    expect(parseAdminEmails("  ").size).toBe(0);
  });
});

describe("isAdminEmail", () => {
  const allow = parseAdminEmails("boss@x.com");

  it("accepts an allow-listed verified email, case-insensitively", () => {
    expect(isAdminEmail("Boss@X.com", true, allow)).toBe(true);
  });

  it("rejects an unverified email even if allow-listed", () => {
    expect(isAdminEmail("boss@x.com", false, allow)).toBe(false);
    expect(isAdminEmail("boss@x.com", undefined, allow)).toBe(false);
  });

  it("rejects other or missing emails and an empty allowlist", () => {
    expect(isAdminEmail("other@x.com", true, allow)).toBe(false);
    expect(isAdminEmail(undefined, true, allow)).toBe(false);
    expect(isAdminEmail("boss@x.com", true, new Set())).toBe(false);
  });

  it("reads ADMIN_EMAILS from the environment by default", () => {
    process.env.ADMIN_EMAILS = "env@x.com";

    expect(isAdminEmail("env@x.com", true)).toBe(true);

    delete process.env.ADMIN_EMAILS;
  });
});
```

- [ ] **Step 2: Run to verify it fails.** Run: `npm run test -- lib/auth/admin.test.ts` → FAIL (module missing).

- [ ] **Step 3: Implement** `lib/auth/admin.ts`:

```ts
export function parseAdminEmails(raw: string | undefined): Set<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** Admin = a VERIFIED Firebase email that is on the ADMIN_EMAILS allowlist. */
export function isAdminEmail(
  email: string | undefined,
  emailVerified: boolean | undefined,
  allowlist: Set<string> = parseAdminEmails(process.env.ADMIN_EMAILS),
): boolean {
  if (emailVerified !== true || !email) return false;
  return allowlist.has(email.toLowerCase());
}
```

- [ ] **Step 4: Run tests** → PASS. **Step 5: Commit**

```bash
git add lib/auth/admin.ts lib/auth/admin.test.ts
git commit -m "security: add the admin email allowlist helpers"
```

### Task 3.2: Dual-mode `assertAdmin` and audit log

**Files:**
- Modify: `src/app/api/admin/guard.ts`, `src/app/api/admin/guard.test.ts`
- Create: `src/app/api/admin/audit.ts`, `src/app/api/admin/audit.test.ts`

**Interfaces:**
- Consumes: `isAdminEmail` (Task 3.1), `userAuth` (`@/lib/firebase-admin`), `verifyAdminPassword` (`@/lib/admin-auth`, removed in Part 4).
- Produces:
  - `assertAdmin(req: NextRequest): Promise<{ adminEmail: string | null }>` — Firebase Bearer token whose verified email is allow-listed → `{ adminEmail }`; otherwise the legacy `x-admin-password` header → `{ adminEmail: null }`; otherwise throws `UnauthorizedError("Unauthorized")`.
  - `auditAdminAction(adminEmail: string | null, action: string, target?: Record<string, unknown>): void` — `logger.warn("Admin action", { admin: adminEmail ?? "legacy-password", action, ...target })`.

- [ ] **Step 1: Rewrite the guard test** (`src/app/api/admin/guard.test.ts` entire file):

```ts
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnauthorizedError } from "@/lib/errors";

const mockVerifyPassword = vi.fn();
vi.mock("@/lib/admin-auth", () => ({
  verifyAdminPassword: (...a: unknown[]) => mockVerifyPassword(...a),
}));

const mockVerifyIdToken = vi.fn();
vi.mock("@/lib/firebase-admin", () => ({
  userAuth: { verifyIdToken: (...a: unknown[]) => mockVerifyIdToken(...a) },
}));

const { assertAdmin } = await import("./guard");

const req = (headers: Record<string, string> = {}) =>
  new NextRequest("http://localhost/api/admin/x", { headers });

beforeEach(() => {
  vi.resetAllMocks();
  process.env.ADMIN_EMAILS = "boss@x.com";
});

describe("assertAdmin with a Firebase token", () => {
  it("accepts an allow-listed verified admin and returns their email", async () => {
    mockVerifyIdToken.mockResolvedValue({ email: "Boss@x.com", email_verified: true });

    await expect(assertAdmin(req({ Authorization: "Bearer tok" }))).resolves.toEqual({
      adminEmail: "boss@x.com",
    });
    expect(mockVerifyIdToken).toHaveBeenCalledWith("tok", true);
  });

  it("does not accept a signed-in user who is not on the allowlist", async () => {
    mockVerifyIdToken.mockResolvedValue({ email: "user@x.com", email_verified: true });
    mockVerifyPassword.mockResolvedValue(false);

    await expect(assertAdmin(req({ Authorization: "Bearer tok" }))).rejects.toThrow(
      UnauthorizedError,
    );
  });

  it("does not accept an unverified allow-listed email", async () => {
    mockVerifyIdToken.mockResolvedValue({ email: "boss@x.com", email_verified: false });
    mockVerifyPassword.mockResolvedValue(false);

    await expect(assertAdmin(req({ Authorization: "Bearer tok" }))).rejects.toThrow(
      UnauthorizedError,
    );
  });

  it("falls through to the legacy password when the token is invalid", async () => {
    mockVerifyIdToken.mockRejectedValue(new Error("bad token"));
    mockVerifyPassword.mockResolvedValue(true);

    await expect(
      assertAdmin(req({ Authorization: "Bearer tok", "x-admin-password": "pw" })),
    ).resolves.toEqual({ adminEmail: null });
  });
});

describe("assertAdmin with the legacy password", () => {
  it("accepts a valid password and returns no admin email", async () => {
    mockVerifyPassword.mockResolvedValue(true);

    await expect(assertAdmin(req({ "x-admin-password": "pw" }))).resolves.toEqual({
      adminEmail: null,
    });
    expect(mockVerifyPassword).toHaveBeenCalledWith("pw");
  });

  it("rejects a wrong or missing password", async () => {
    mockVerifyPassword.mockResolvedValue(false);

    await expect(assertAdmin(req())).rejects.toThrow(UnauthorizedError);
    expect(mockVerifyPassword).toHaveBeenCalledWith(null);
  });
});
```

- [ ] **Step 2: Run to verify it fails.** `npm run test -- src/app/api/admin/guard.test.ts` → FAIL (`assertAdmin` returns undefined; no token path).

- [ ] **Step 3: Rewrite `guard.ts`:**

```ts
import { verifyAdminPassword } from "@/lib/admin-auth";
import { isAdminEmail } from "@/lib/auth/admin";
import { UnauthorizedError } from "@/lib/errors";
import { userAuth } from "@/lib/firebase-admin";
import type { NextRequest } from "next/server";

async function adminEmailFromToken(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ") || !userAuth) return null;

  try {
    const decoded = await userAuth.verifyIdToken(authHeader.slice("Bearer ".length), true);
    return isAdminEmail(decoded.email, decoded.email_verified) ? decoded.email!.toLowerCase() : null;
  } catch {
    return null;
  }
}

/**
 * Rejects the request unless it is from an admin. Admins are verified Firebase accounts on the
 * ADMIN_EMAILS allowlist. TEMPORARY: the legacy shared password (x-admin-password) is still
 * accepted until the cutover PR removes it; that path returns `adminEmail: null`.
 */
export async function assertAdmin(req: NextRequest): Promise<{ adminEmail: string | null }> {
  const adminEmail = await adminEmailFromToken(req);
  if (adminEmail) return { adminEmail };

  if (await verifyAdminPassword(req.headers.get("x-admin-password"))) {
    return { adminEmail: null };
  }

  throw new UnauthorizedError("Unauthorized");
}
```

- [ ] **Step 4: Audit helper — failing test** (`src/app/api/admin/audit.test.ts`):

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockWarn = vi.fn();
vi.mock("@/lib/logger", () => ({ logger: { warn: (...a: unknown[]) => mockWarn(...a) } }));

const { auditAdminAction } = await import("./audit");

beforeEach(() => vi.clearAllMocks());

describe("auditAdminAction", () => {
  it("logs the admin, action and target", () => {
    auditAdminAction("boss@x.com", "delete-user", { userId: "u1" });

    expect(mockWarn).toHaveBeenCalledWith("Admin action", {
      admin: "boss@x.com",
      action: "delete-user",
      userId: "u1",
    });
  });

  it("labels the legacy password path", () => {
    auditAdminAction(null, "clean-test-data");

    expect(mockWarn).toHaveBeenCalledWith("Admin action", {
      admin: "legacy-password",
      action: "clean-test-data",
    });
  });
});
```

- [ ] **Step 5: Implement** `audit.ts`:

```ts
import { logger } from "@/lib/logger";

/** Structured trail for destructive admin actions (visible in the hosting log stream). */
export function auditAdminAction(
  adminEmail: string | null,
  action: string,
  target: Record<string, unknown> = {},
) {
  logger.warn("Admin action", { admin: adminEmail ?? "legacy-password", action, ...target });
}
```

- [ ] **Step 6: Run** `npm run test -- src/app/api/admin` → PASS. **Step 7: Commit**

```bash
git add src/app/api/admin/guard.ts src/app/api/admin/guard.test.ts src/app/api/admin/audit.ts src/app/api/admin/audit.test.ts
git commit -m "security: let allow-listed Firebase admins through assertAdmin and add an audit log helper"
```

### Task 3.3: Use the guard result: audit calls, whats-new, and `/api/admin/me`

**Files:**
- Modify: `src/app/api/admin/users/[id]/route.ts`, `src/app/api/admin/db/maintenance/route.ts`, `src/app/api/admin/config/route.ts`, `src/app/api/config/whats-new/route.ts`
- Create: `src/app/api/admin/me/route.ts`

**Interfaces:**
- Consumes: `assertAdmin`, `auditAdminAction`, `withRateLimit`.

- [ ] **Step 1: `users/[id]/route.ts`** — replace the body of `DELETE`:

```ts
    const { adminEmail } = await assertAdmin(req);
    const { id } = await params;
    auditAdminAction(adminEmail, "delete-user", { userId: id });
    return NextResponse.json(await deleteUserService(id));
```
and add `import { auditAdminAction } from "../../audit";`.

- [ ] **Step 2: `db/maintenance/route.ts`** — replace `await assertAdmin(req);` with `const { adminEmail } = await assertAdmin(req);` and, immediately after the `maintenanceSchema.parse` line, add `auditAdminAction(adminEmail, `maintenance:${action}`);` with `import { auditAdminAction } from "../../audit";`.

- [ ] **Step 3: `admin/config/route.ts`** — in `POST`, replace `await assertAdmin(req);` with `const { adminEmail } = await assertAdmin(req);` and after parsing the body add `auditAdminAction(adminEmail, "update-config", { key: body.key });` with `import { auditAdminAction } from "../audit";`.

- [ ] **Step 4: What's-new POST onto the guard.** In `src/app/api/config/whats-new/route.ts` delete the `UnauthorizedError` import and the `x-admin-password` comparison block, add `import { assertAdmin } from "../../admin/guard";` and `import { auditAdminAction } from "../../admin/audit";`, and make `POST`:

```ts
export async function POST(req: NextRequest) {
  try {
    const { adminEmail } = await assertAdmin(req);

    const body = whatsNewConfigSchema.parse(await req.json());
    auditAdminAction(adminEmail, "update-whats-new", { version: body.version });
    const config = await updateWhatsNewConfigService(body);
    return NextResponse.json({ success: true, config });
  } catch (error) {
    return handleApiError(error);
  }
}
```

- [ ] **Step 5: Create `/api/admin/me`** (`src/app/api/admin/me/route.ts`):

```ts
import { handleApiError } from "@/lib/handle-api-error";
import { withRateLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "../guard";

/** Lets the admin UI ask "am I an admin?" after a Firebase sign-in. */
async function handler(req: NextRequest) {
  try {
    const { adminEmail } = await assertAdmin(req);
    return NextResponse.json({ email: adminEmail });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withRateLimit("admin-signin", handler);
```

- [ ] **Step 6: Verify and commit**

Run: `npx tsc --noEmit && npm run lint && npm run test`

```bash
git add src/app/api
git commit -m "security: audit destructive admin actions and add /api/admin/me"
```

### Task 3.4: Admin UI on Firebase sign-in (password fallback kept)

**Files:**
- Create: `src/app/admin/legacyAdminHeaders.ts`
- Modify: `src/app/admin/layout.tsx`, `src/app/admin/users/page.tsx`, `src/app/admin/database/page.tsx`, `src/app/admin/config/page.tsx`, `src/app/admin/whats-new/page.tsx`

**Interfaces:**
- Produces: `legacyAdminHeaders(): Record<string, string>` — `{ "x-admin-password": pw }` when `sessionStorage.admin_password` is set, else `{}`. Deleted in Part 4.

- [ ] **Step 1: Create the helper**

```ts
// TEMPORARY (removed with the password path in the cutover PR).
export function legacyAdminHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const password = sessionStorage.getItem("admin_password");
  return password ? { "x-admin-password": password } : {};
}
```

- [ ] **Step 2: Pages use the shared `api` instance** (it attaches the Firebase Bearer token automatically and has `baseURL: "/api"`). In each of `users`, `database`, `config` pages: replace `import axios from "axios";` with `import api from "@/lib/axios";`, remove the `const password = sessionStorage.getItem("admin_password"); if (!password) {...}` guards and the `password` locals, and change every call as follows (add `import { legacyAdminHeaders } from "../legacyAdminHeaders";`):

```ts
// users/page.tsx
const response = await api.get("/admin/users", { headers: legacyAdminHeaders() });
await api.delete(`/admin/users/${userId}`, { headers: legacyAdminHeaders() });
// database/page.tsx
const response = await api.get("/admin/db/stats", { headers: legacyAdminHeaders() });
const response = await api.post("/admin/db/maintenance", { action: "clean-test-data" }, { headers: legacyAdminHeaders() });
// config/page.tsx
const response = await api.get("/admin/config", { headers: legacyAdminHeaders() });
await api.post("/admin/config", { key, value }, { headers: legacyAdminHeaders() });
```

In `whats-new/page.tsx` replace the `handleSave` body's password check and `fetch` with:

```ts
    setSaving(true);
    try {
      await api.post("/config/whats-new", { version, features }, { headers: legacyAdminHeaders() });
      alert("Configuration saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save configuration.");
    } finally {
      setSaving(false);
    }
```
(`api` is already imported there; the old code also never checked `res.ok`, so a 401 used to look like success — now an error alerts.)

- [ ] **Step 3: Layout.** Replace `src/app/admin/layout.tsx` with a component that (1) uses `useCurrentUser()`; (2) once the auth state has loaded and a user exists, calls `api.get("/admin/me", { headers: legacyAdminHeaders() })`; 200 → render `children`; 401/403 → "Not authorised" card showing the signed-in email; (3) with no signed-in user → a card with a sign-in link (`<Link href='/login'>`) **and** the existing password form beneath it ("Use the legacy password instead — removed soon"), which on success stores `admin_password` in `sessionStorage` exactly as the current `handleLogin` does but verifies with `api.get("/admin/me", { headers: { "x-admin-password": password } })`. Keep the visual styling of the current login card. Skeleton:

```tsx
"use client";

import api from "@/lib/axios";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { Lock } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { legacyAdminHeaders } from "./legacyAdminHeaders";

type Status = "checking" | "admin" | "forbidden" | "signed-out";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useCurrentUser();
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (loading) return;
    const hasLegacy = Object.keys(legacyAdminHeaders()).length > 0;
    if (!user && !hasLegacy) {
      setStatus("signed-out");
      return;
    }
    api
      .get("/admin/me", { headers: legacyAdminHeaders() })
      .then(() => setStatus("admin"))
      .catch(() => setStatus(user ? "forbidden" : "signed-out"));
  }, [user, loading]);

  const handleLegacyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.get("/admin/me", { headers: { "x-admin-password": password } });
      sessionStorage.setItem("admin_password", password);
      setStatus("admin");
    } catch {
      alert("Invalid Password");
    }
  };

  if (status === "checking") {
    return (
      <div className='min-h-screen bg-slate-950 flex items-center justify-center'>
        <div className='w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin' />
      </div>
    );
  }

  if (status === "admin") return <>{children}</>;

  return (
    <main className='min-h-screen bg-slate-950 flex items-center justify-center p-6'>
      <div className='w-full max-w-md bg-slate-900/50 border border-white/10 rounded-3xl p-8 shadow-2xl'>
        <div className='flex justify-center mb-6'>
          <div className='w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center'>
            <Lock className='w-8 h-8 text-white' />
          </div>
        </div>
        <h1 className='text-2xl font-bold text-white text-center mb-2'>Admin Access</h1>
        {status === "forbidden" ? (
          <p className='text-slate-400 text-center mb-6'>
            {user?.email} is not authorised for the admin portal.
          </p>
        ) : (
          <p className='text-slate-400 text-center mb-6'>
            Sign in with an admin account to continue.
          </p>
        )}
        {!user && (
          <Link
            href='/login'
            className='block w-full text-center bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold py-3 rounded-xl'
          >
            Sign in
          </Link>
        )}
        <form onSubmit={handleLegacyLogin} className='space-y-3 mt-8'>
          <p className='text-xs text-slate-500 text-center'>
            Legacy password (removed soon)
          </p>
          <input
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder='Legacy password'
            className='w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500'
          />
          <button className='w-full bg-slate-800 text-slate-300 py-2 rounded-xl text-sm'>
            Unlock with password
          </button>
        </form>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Verify** — `npx tsc --noEmit && npm run lint && npm run test`; `grep -rn "from \"axios\"" src/app/admin` must print nothing.

- [ ] **Step 5: Commit and ship Part 3**

```bash
git add -A
git commit -m "security: move the admin portal to Firebase sign-in with a temporary password fallback"
git push -u origin security/admin-firebase
gh pr create --base dev --title "security: admin access via Firebase sign-in (allowlist), password still accepted" --body "<summary; ADMIN_EMAILS must be set before deploy; QA: sign in as an allow-listed admin and open users/database/config/whats-new; sign in as a non-admin and see 'not authorised'; legacy password still works; destructive actions log 'Admin action'.>"
```

Poll checks, merge that PR, `git checkout dev && git pull --ff-only`.

### Task 3.5: MAINTAINER production gate (STOP)

- [ ] **Step 1:** After the deploy, the maintainer signs in to `/admin` with their Firebase account and confirms all four admin pages work **without** the legacy password. Do not start Part 4 until they say so.

---

# Part 4: Admin cutover (remove the shared password)

Branch: `security/admin-cutover`

### Task 4.1: Delete the password path

**Files:**
- Delete: `lib/admin-auth.ts`, `src/app/api/admin/verify-password/` (route, services, schemas, tests), `scripts/sync-admin-password.ts`, `src/app/admin/legacyAdminHeaders.ts`
- Modify: `src/app/api/admin/guard.ts`, `src/app/api/admin/guard.test.ts`, `src/app/admin/layout.tsx`, the four admin pages, `package.json` (script entry if present), `.env.example`, `CLAUDE.md`, `.agent/*`, `API_REFERENCE.md`, the cleanup spec

- [ ] **Step 1: Update the guard test first** — in `guard.test.ts` delete the `@/lib/admin-auth` mock, the whole `describe("assertAdmin with the legacy password")` block, and the "falls through to the legacy password" test; change the two "does not accept…" tests to expect `UnauthorizedError` without `mockVerifyPassword`, and add:

```ts
  it("rejects a request with no credentials", async () => {
    await expect(assertAdmin(req())).rejects.toThrow(UnauthorizedError);
  });
```

Run: `npm run test -- src/app/api/admin/guard.test.ts` → PASS still (the old guard tolerates it) — proceed.

- [ ] **Step 2: Simplify `guard.ts`** to (delete the password import and branch):

```ts
export async function assertAdmin(req: NextRequest): Promise<{ adminEmail: string }> {
  const adminEmail = await adminEmailFromToken(req);
  if (!adminEmail) {
    throw new UnauthorizedError("Unauthorized");
  }
  return { adminEmail };
}
```
and fix the doc comment (no temporary password mention). `auditAdminAction`'s `adminEmail` parameter keeps accepting `string | null`; change its signature to `adminEmail: string` and drop the `?? "legacy-password"` (update `audit.test.ts` by deleting the "labels the legacy password path" test).

- [ ] **Step 2b: Remove files and clients**

```bash
git rm lib/admin-auth.ts scripts/sync-admin-password.ts src/app/admin/legacyAdminHeaders.ts
git rm -r src/app/api/admin/verify-password
```
In each admin page delete the `legacyAdminHeaders` import and the `{ headers: legacyAdminHeaders() }` arguments (calls become `api.get("/admin/users")`, `api.post("/admin/config", { key, value })`, etc.). In `layout.tsx` remove the legacy form, `legacyAdminHeaders` use, the `password` state and `handleLegacyLogin`; the `/admin/me` call takes no headers and the `hasLegacy` shortcut goes away (`if (!user) { setStatus("signed-out"); return; }`).

- [ ] **Step 3: Block the retired config key.** In `src/app/api/admin/config/schemas.ts` change the key rule to:

```ts
  key: z
    .string()
    .min(1, "Key is required")
    .refine((key) => key !== "admin_password", "This key is no longer used"),
```
and add to `schemas.test.ts`:

```ts
  it("rejects the retired admin_password key", () => {
    expect(upsertConfigSchema.safeParse({ key: "admin_password", value: "x" }).success).toBe(false);
  });
```
In `src/app/api/admin/config/services.ts` make `listConfigsService` filter it from the listing:

```ts
export async function listConfigsService() {
  const configs = await listAppConfigs();
  return configs.filter((config) => config.key !== "admin_password");
}
```
with a matching test in `services.test.ts`:

```ts
  it("never lists the retired admin_password row", async () => {
    mockList.mockResolvedValue([{ key: "admin_password" }, { key: "a" }]);

    expect(await listConfigsService()).toEqual([{ key: "a" }]);
  });
```
(Replace the existing `"lists configs from the repository"` assertion input if it conflicts.)

- [ ] **Step 4: Docs/env.** Remove `ADMIN_PASSWORD` from `.env.example` (none present) and from `CLAUDE.md`'s env list; replace the `CLAUDE.md` admin bullet ("Admin routes currently gate on a single shared password...") with: "Admin routes call `assertAdmin(req)` (`src/app/api/admin/guard.ts`): a verified Firebase account whose email is in `ADMIN_EMAILS`. Destructive admin actions must call `auditAdminAction`." Remove password mentions from `.agent/*`, `API_REFERENCE.md`; in the cleanup spec mark the Admin note "shared password removed in the security pass". `grep -rn "ADMIN_PASSWORD\|x-admin-password\|admin_password" src lib scripts CLAUDE.md .agent API_REFERENCE.md package.json` must only show the config-key guard code and tests.

- [ ] **Step 5: Verify, commit, ship Part 4**

Run: `npx tsc --noEmit && npm run lint && npm run test`

```bash
git add -A
git commit -m "security: remove the shared admin password"
git push -u origin security/admin-cutover
gh pr create --base dev --title "security: remove the shared admin password (Firebase admins only)" --body "<summary; only merge after Part 3's production check; QA: admin portal works signed in; curl with x-admin-password now returns 401; MAINTAINER cleanup: run DELETE FROM \"AppConfig\" WHERE key = 'admin_password'; and remove ADMIN_PASSWORD from the hosting env after this deploys>"
```

Poll checks, merge, `git checkout dev && git pull --ff-only`.

---

# Part 5: Signed guest tokens

Branch: `security/guest-tokens`

### Task 5.0: MAINTAINER prerequisite (STOP gate)

- [ ] **Step 1:** Ask the maintainer to generate `GUEST_TOKEN_SECRET` (`openssl rand -base64 32`) and set it in `.env` and every hosting environment before this PR deploys.

### Task 5.1: Token module

**Files:**
- Create: `lib/auth/guest-token.ts`, `lib/auth/guest-token.test.ts`

**Interfaces:**
- Produces:
  - `GUEST_TOKEN_TTL_SECONDS = 86_400`
  - `signGuestToken(groupId: string, now?: number): string` — throws `Error("GUEST_TOKEN_SECRET is not configured")` when the secret is unset
  - `verifyGuestToken(token: string, now?: number): { groupId: string } | null` — `null` for malformed, wrong-signature, wrong-secret or expired tokens (never throws for bad input; also `null` when the secret is unset)
  - `now` is epoch **seconds** (default `Math.floor(Date.now() / 1000)`).

- [ ] **Step 1: Write the failing tests:**

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GUEST_TOKEN_TTL_SECONDS, signGuestToken, verifyGuestToken } from "./guest-token";

const NOW = 1_800_000_000;

beforeEach(() => {
  process.env.GUEST_TOKEN_SECRET = "test-secret-test-secret-test-secret";
});
afterEach(() => {
  delete process.env.GUEST_TOKEN_SECRET;
});

describe("guest tokens", () => {
  it("round-trips a group id", () => {
    const token = signGuestToken("group-1", NOW);

    expect(verifyGuestToken(token, NOW + 60)).toEqual({ groupId: "group-1" });
  });

  it("expires after the TTL", () => {
    const token = signGuestToken("group-1", NOW);

    expect(verifyGuestToken(token, NOW + GUEST_TOKEN_TTL_SECONDS - 1)).not.toBeNull();
    expect(verifyGuestToken(token, NOW + GUEST_TOKEN_TTL_SECONDS + 1)).toBeNull();
  });

  it("rejects a token whose payload was tampered with", () => {
    const [, signature] = signGuestToken("group-1", NOW).split(".");
    const forgedPayload = Buffer.from(
      JSON.stringify({ gid: "group-2", exp: NOW + 1000 }),
    ).toString("base64url");

    expect(verifyGuestToken(`${forgedPayload}.${signature}`, NOW)).toBeNull();
  });

  it("rejects a token signed with a different secret", () => {
    const token = signGuestToken("group-1", NOW);
    process.env.GUEST_TOKEN_SECRET = "another-secret-another-secret-123";

    expect(verifyGuestToken(token, NOW)).toBeNull();
  });

  it("rejects garbage without throwing", () => {
    for (const bad of ["", "abc", "a.b.c", "....", "e30.e30"]) {
      expect(verifyGuestToken(bad, NOW)).toBeNull();
    }
  });

  it("refuses to sign, and to verify, without a secret", () => {
    const token = signGuestToken("group-1", NOW);
    delete process.env.GUEST_TOKEN_SECRET;

    expect(() => signGuestToken("group-1", NOW)).toThrow("GUEST_TOKEN_SECRET is not configured");
    expect(verifyGuestToken(token, NOW)).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails.** `npm run test -- lib/auth/guest-token.test.ts` → FAIL (module missing).

- [ ] **Step 3: Implement** `lib/auth/guest-token.ts`:

```ts
import { createHmac, timingSafeEqual } from "node:crypto";

export const GUEST_TOKEN_TTL_SECONDS = 24 * 60 * 60;

const nowSeconds = () => Math.floor(Date.now() / 1000);

function sign(payloadPart: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(payloadPart).digest();
}

/** A short-lived, server-signed proof that the holder validated the code of `groupId`. */
export function signGuestToken(groupId: string, now: number = nowSeconds()): string {
  const secret = process.env.GUEST_TOKEN_SECRET;
  if (!secret) {
    throw new Error("GUEST_TOKEN_SECRET is not configured");
  }

  const payloadPart = Buffer.from(
    JSON.stringify({ gid: groupId, exp: now + GUEST_TOKEN_TTL_SECONDS }),
  ).toString("base64url");

  return `${payloadPart}.${sign(payloadPart, secret).toString("base64url")}`;
}

/** Returns the group the token was issued for, or null if it is invalid, tampered or expired. */
export function verifyGuestToken(token: string, now: number = nowSeconds()): { groupId: string } | null {
  const secret = process.env.GUEST_TOKEN_SECRET;
  if (!secret) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadPart, signaturePart] = parts;

  const expected = sign(payloadPart, secret);
  const actual = Buffer.from(signaturePart, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return null;
  }

  try {
    const { gid, exp } = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8"));
    if (typeof gid !== "string" || typeof exp !== "number" || exp <= now) return null;
    return { groupId: gid };
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run tests** → PASS. **Step 5: Commit**

```bash
git add lib/auth/guest-token.ts lib/auth/guest-token.test.ts
git commit -m "security: add signed guest tokens"
```

### Task 5.2: `withOptionalAuth` reads the token

**Files:**
- Modify: `lib/auth/with-auth.ts`, `lib/auth/with-auth.test.ts`

**Interfaces:**
- Consumes: `verifyGuestToken` (Task 5.1).
- Produces: `OptionalAuthContext { isGuest: boolean; guestGroupId?: string }` (`groupCode` removed). Guest requests send header `X-Guest-Token`; an invalid/expired token yields 401 `{ message: "Invalid or expired guest token" }`.

- [ ] **Step 1: Replace the existing withOptionalAuth guest test** in `with-auth.test.ts` (the one using `X-Guest-Code`) and add cases. Add near the top: `const mockVerifyGuestToken = vi.fn(); vi.mock("./guest-token", () => ({ verifyGuestToken: (...a: unknown[]) => mockVerifyGuestToken(...a) }));`

```ts
describe("withOptionalAuth guests", () => {
  it("passes a verified guest token's group id and the route context to the handler", async () => {
    mockVerifyGuestToken.mockReturnValue({ groupId: "g1" });
    const handler = vi.fn().mockResolvedValue(NextResponse.json(null));
    const routeContext = { params: Promise.resolve({ groupId: "g1" }) };

    await withOptionalAuth(handler)(makeRequest({ "X-Guest-Token": "tok" }), routeContext);

    const [, ctx, forwarded] = handler.mock.calls[0];
    expect(ctx).toMatchObject({ isGuest: true, guestGroupId: "g1", uid: "guest" });
    expect(ctx).not.toHaveProperty("groupCode");
    expect(forwarded).toBe(routeContext);
  });

  it("returns 401 for an invalid or expired guest token", async () => {
    mockVerifyGuestToken.mockReturnValue(null);
    const handler = vi.fn();

    const response = await withOptionalAuth(handler)(makeRequest({ "X-Guest-Token": "bad" }));

    expect(response.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("no longer accepts a raw X-Guest-Code header", async () => {
    const handler = vi.fn();

    const response = await withOptionalAuth(handler)(makeRequest({ "X-Guest-Code": "ABC123" }));

    expect(response.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("prefers a valid Firebase user over a guest token", async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: "user-1" });
    const handler = vi.fn().mockResolvedValue(NextResponse.json(null));

    await withOptionalAuth(handler)(
      makeRequest({ Authorization: "Bearer t", "X-Guest-Token": "tok" }),
    );

    expect(handler.mock.calls[0][1].isGuest).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify failures**, then **Step 3: replace `withOptionalAuth` and its context type** in `with-auth.ts` (import `verifyGuestToken` from `./guest-token`):

```ts
export interface OptionalAuthContext extends AuthContext {
  isGuest: boolean;
  /** Set only for guests: the group their verified token was issued for. */
  guestGroupId?: string;
}

/**
 * Allows both authenticated users (Firebase token) and guests (server-signed X-Guest-Token,
 * obtained from POST /api/groups/validate-code). `guestGroupId` is already verified, but each
 * handler must still check it against the group/trip actually being accessed.
 */
export function withOptionalAuth<
  Params extends Record<string, string> = Record<string, string>,
>(
  handler: (
    req: NextRequest,
    context: OptionalAuthContext,
    routeContext: RouteContext<Params>,
  ) => Promise<NextResponse>,
) {
  return async (
    req: NextRequest,
    routeContext?: RouteContext<Params>,
  ): Promise<NextResponse> => {
    const run = async (context: OptionalAuthContext) => {
      try {
        return await handler(req, context, routeContext as RouteContext<Params>);
      } catch (error) {
        return handleApiError(error);
      }
    };

    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split("Bearer ")[1];
      if (token && userAuth) {
        try {
          const decodedToken = await userAuth.verifyIdToken(token, CHECK_REVOKED);
          return run({
            uid: decodedToken.uid,
            email: decodedToken.email,
            emailVerified: decodedToken.email_verified,
            decodedToken,
            isGuest: false,
          });
        } catch (error) {
          logger.warn("Token validation failed, checking for guest access", { error });
        }
      }
    }

    const guestToken = req.headers.get("X-Guest-Token");
    if (guestToken) {
      const verified = verifyGuestToken(guestToken);
      if (!verified) {
        return NextResponse.json({ message: "Invalid or expired guest token" }, { status: 401 });
      }
      return run({
        uid: "guest",
        isGuest: true,
        guestGroupId: verified.groupId,
        decodedToken: {} as DecodedIdToken,
      });
    }

    return NextResponse.json(
      { message: "Unauthorized - authentication or a guest token is required" },
      { status: 401 },
    );
  };
}
```

- [ ] **Step 4: Run** `npm run test -- lib/auth/with-auth.test.ts` → PASS. `npx tsc --noEmit` now reports errors in the guest routes/services — fixed in Task 5.3.
- [ ] **Step 5: Commit** — `git add lib/auth && git commit -m "security: authenticate guests with signed tokens instead of the raw group code"`

### Task 5.3: Guest services compare group ids

**Files:**
- Modify: `src/app/api/trips/access.ts`, `src/app/api/trips/access.test.ts`, `src/app/api/trips/repository.ts`, `src/app/api/groups/services.ts`, `src/app/api/groups/services.test.ts`, `src/app/api/groups/[groupId]/guest/route.ts`, `src/app/api/trips/[tripId]/expenses/{route,services}.ts` (+ `services.test.ts`), `src/app/api/trips/[tripId]/payment-logs/{route,services}.ts` (+ `services.test.ts`)

**Interfaces:**
- Produces: `verifyGuestTripAccess(guestGroupId: string, tripId: string): Promise<{ trip: { id: string; groupId: string } }>` (throws `NotFoundError("Trip not found")`, or `ForbiddenError("Invalid guest access")` when `trip.groupId !== guestGroupId`); `getGroupByIdForGuestService(guestGroupId: string, groupId: string)` (throws `ForbiddenError("Invalid guest access")` when the ids differ, then `NotFoundError("Group not found")`); `listExpensesForGuestService(guestGroupId, tripId)`, `listPaymentLogsForGuestService(guestGroupId, tripId)`.

- [ ] **Step 1: Update tests first.**
  - `trips/access.test.ts`: replace the `findTripWithGroupCode` mock with the existing `mockFindTripAccessInfo` and rewrite the `verifyGuestTripAccess` block:

```ts
describe("verifyGuestTripAccess", () => {
  it("throws NotFoundError when the trip doesn't exist", async () => {
    mockFindTripAccessInfo.mockResolvedValue(null);

    await expect(verifyGuestTripAccess("group-1", "trip-1")).rejects.toThrow(NotFoundError);
  });

  it("throws ForbiddenError when the guest's token is for a different group", async () => {
    mockFindTripAccessInfo.mockResolvedValue({ id: "trip-1", groupId: "group-2", name: "T" });

    await expect(verifyGuestTripAccess("group-1", "trip-1")).rejects.toThrow(ForbiddenError);
  });

  it("returns the trip when the token's group owns it", async () => {
    mockFindTripAccessInfo.mockResolvedValue({ id: "trip-1", groupId: "group-1", name: "T" });

    expect(await verifyGuestTripAccess("group-1", "trip-1")).toEqual({
      trip: { id: "trip-1", groupId: "group-1" },
    });
  });
});
```
  (remove `mockFindTripWithGroupCode` from the repository mock.)
  - `groups/services.test.ts` `getGroupByIdForGuestService` block (lines ~247-270): change the calls to `getGroupByIdForGuestService("group-1", "group-1")` for success, `("other-group", "group-1")` for a mismatch → `ForbiddenError`, and keep the missing-group case (`findGroupById` → null with matching ids → `NotFoundError`). Read the existing block and keep its mocking style.
  - `expenses/services.test.ts` and `payment-logs/services.test.ts`: their guest-list tests already assert `mockVerifyGuestTripAccess` is called with `("ABC123", "t1")` — change the literal to `"group-1"` (argument is now a group id).

- [ ] **Step 2: Run** `npm run test` → the updated tests FAIL.

- [ ] **Step 3: Implement.**
  - `trips/access.ts` — replace `verifyGuestTripAccess`:

```ts
// The guest's token proves which group they validated; make sure that is the trip's group.
export async function verifyGuestTripAccess(guestGroupId: string, tripId: string) {
  const trip = await findTripAccessInfo(tripId);
  if (!trip) {
    throw new NotFoundError("Trip not found");
  }
  if (trip.groupId !== guestGroupId) {
    throw new ForbiddenError("Invalid guest access");
  }
  return { trip: { id: trip.id, groupId: trip.groupId } };
}
```
  and the import line becomes `import { findTripAccessInfo } from "./repository";`; delete `findTripWithGroupCode` from `trips/repository.ts`.
  - `groups/services.ts` — replace `getGroupByIdForGuestService`:

```ts
export async function getGroupByIdForGuestService(guestGroupId: string, groupId: string) {
  if (guestGroupId !== groupId) {
    throw new ForbiddenError("Invalid guest access");
  }

  const group = await findGroupById(groupId);
  if (!group) {
    throw new NotFoundError("Group not found");
  }

  logger.info("Guest accessed group", { groupId: group.id });
  return group;
}
```
  - Services: in `expenses/services.ts` and `payment-logs/services.ts` rename the parameter `groupCode` → `guestGroupId` in `listExpensesForGuestService` / `listPaymentLogsForGuestService` (body unchanged).
  - Routes: `groups/[groupId]/guest/route.ts` — `if (!context.isGuest || !context.guestGroupId)` and `getGroupByIdForGuestService(context.guestGroupId, groupId)`. `expenses/route.ts` and `payment-logs/route.ts` — replace `context.isGuest && context.groupCode` with `context.isGuest && context.guestGroupId` and pass `context.guestGroupId`.

- [ ] **Step 4: Run** `npx tsc --noEmit && npm run test` → PASS.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "security: verify guests by the group id in their token, not the raw code"`

### Task 5.4: `validate-code` issues the token

**Files:**
- Modify: `src/app/api/groups/validate-code/route.ts`, `src/app/api/groups/services.ts`
- Test: `src/app/api/groups/services.test.ts`

**Interfaces:**
- Consumes: `signGuestToken` (Task 5.1), `withRateLimit` (Part 2).
- Produces: `POST /api/groups/validate-code` → `{ groupId, groupName, guestToken }` (the `code` field is gone). `validateGroupCodeService(code)` no longer logs the code.

- [ ] **Step 1: Failing test** — in `groups/services.test.ts` add to the `validateGroupCodeService` describe (create it if absent, following the file's mock setup):

```ts
  it("does not log the group code it was asked to validate", async () => {
    mockFindGroupCodeLookup.mockResolvedValue({ id: "g1", name: "Crew", code: "ABC123" });
    mockLoggerInfo.mockClear();

    await validateGroupCodeService("ABC123");

    expect(JSON.stringify(mockLoggerInfo.mock.calls)).not.toContain("ABC123");
  });
```
(use the file's existing logger and repository mock names; if the logger mock isn't captured, capture it with `const mockLoggerInfo = vi.fn();` in that mock factory, as other tests in the repo do).

- [ ] **Step 2: Implement.** In `groups/services.ts` change the log line to `logger.info("Group code validated", { groupId: group.id });`. In `validate-code/route.ts`:

```ts
import { signGuestToken } from "@/lib/auth/guest-token";
import { AppError } from "@/lib/errors";
// ...
    const group = await validateGroupCodeService(code.toUpperCase());

    let guestToken: string;
    try {
      guestToken = signGuestToken(group.id);
    } catch {
      throw new AppError("Guest access is not configured", 500);
    }

    return NextResponse.json({
      groupId: group.id,
      groupName: group.name,
      guestToken,
    });
```

- [ ] **Step 3: Run** `npx tsc --noEmit && npm run test` → PASS. **Step 4: Commit** — `git add -A && git commit -m "security: validate-code issues a guest token and stops logging or returning the code"`

### Task 5.5: Client uses the token

**Files:**
- Modify: `lib/guest-session.ts`, `lib/axios.ts`, `src/app/guest/join/components/GuestNameForm/index.tsx`

**Interfaces:**
- Produces: `GuestSession { groupCode; guestName; groupId; guestToken?: string }`; `setGuestSession(groupCode, guestName, groupId, guestToken?)`; `refreshGuestToken(): Promise<string | null>` (re-validates the stored code against `/api/groups/validate-code` with plain axios, stores and returns the new token, or `null`).

- [ ] **Step 1: `lib/guest-session.ts`.** Add `guestToken?: string;` to `GuestSession`; change `setGuestSession` to take a fourth optional `guestToken` and store it; and add:

```ts
import axios from "axios";

/**
 * The stored code is only ever sent to validate-code (rate limited) to obtain a fresh token;
 * data requests carry the token, never the code.
 */
export async function refreshGuestToken(): Promise<string | null> {
  const session = getGuestSession();
  if (!session) return null;

  try {
    const { data } = await axios.post("/api/groups/validate-code", { code: session.groupCode });
    if (!data?.guestToken) return null;
    localStorage.setItem(
      GUEST_SESSION_KEY,
      JSON.stringify({ ...session, guestToken: data.guestToken }),
    );
    return data.guestToken;
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: `lib/axios.ts`.** Import `refreshGuestToken` next to `getGuestSession`. Replace the guest branch of the request interceptor and the 401 handling:

```ts
    } catch {
      // Not signed in: use the guest session if there is one
      const guestSession = getGuestSession();
      if (guestSession) {
        const guestToken = guestSession.guestToken ?? (await refreshGuestToken());
        if (guestToken) {
          config.headers["X-Guest-Token"] = guestToken;
        }
      }
    }
    return config;
```

```ts
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isGuestRequest = !!original?.headers?.["X-Guest-Token"];

    // An expired guest token: get a new one from the stored code and retry once.
    if (error.response?.status === 401 && isGuestRequest && !original._guestRetried) {
      original._guestRetried = true;
      const guestToken = await refreshGuestToken();
      if (guestToken) {
        original.headers["X-Guest-Token"] = guestToken;
        return api(original);
      }
    }
    return Promise.reject(error);
  },
);
```

- [ ] **Step 3: `GuestNameForm/index.tsx`.** Remove the three `console.log` lines that print the code and the API response, and store the token:

```ts
      const { groupId, guestToken } = response.data;

      // Store guest session
      setGuestSession(normalizedCode, data.name, groupId, guestToken);
```

- [ ] **Step 4: Verify** — `npx tsc --noEmit && npm run lint && npm run test`. `grep -rn "X-Guest-Code" src lib` must print nothing. (`lib/socket.ts` still sends `groupCode` to the external socket server — known residual risk, see spec; leave it.)

- [ ] **Step 5: Commit and ship Part 5**

```bash
git add -A
git commit -m "security: guests send a signed token; the code is only used to refresh it"
git push -u origin security/guest-tokens
gh pr create --base dev --title "security: signed guest tokens replace the raw group code" --body "<summary; GUEST_TOKEN_SECRET must be set before deploy; residual risk: the external socket server still receives the raw code; QA: fresh browser guest join, guest browse group/trips/expenses/payment logs, guest with a pre-existing session (only groupCode stored) upgrades silently, a wrong code still fails, >10 validate attempts/min gets 429>"
```

Poll checks, merge, `git checkout dev && git pull --ff-only`.

---

# Part 6: Narrowed permissions

Branch: `security/permissions`

### Task 6.1: Permission helper

**Files:**
- Create: `src/app/api/groups/permissions.ts`, `src/app/api/groups/permissions.test.ts`

**Interfaces:**
- Produces:
  - `canModify(opts: { actorId: string; allowedUserIds: (string | null | undefined)[]; groupOwnerId: string | null | undefined }): boolean`
  - `assertCanModify(opts: same, message: string): void` — throws `ForbiddenError(message)`.

- [ ] **Step 1: Failing tests:**

```ts
import { describe, expect, it } from "vitest";
import { ForbiddenError } from "@/lib/errors";
import { assertCanModify, canModify } from "./permissions";

describe("canModify", () => {
  const base = { actorId: "u1", allowedUserIds: ["creator", "payer"], groupOwnerId: "owner" };

  it("allows any listed user", () => {
    expect(canModify({ ...base, actorId: "creator" })).toBe(true);
    expect(canModify({ ...base, actorId: "payer" })).toBe(true);
  });

  it("allows the group owner", () => {
    expect(canModify({ ...base, actorId: "owner" })).toBe(true);
  });

  it("rejects everyone else", () => {
    expect(canModify(base)).toBe(false);
  });

  it("ignores null/undefined entries so a missing creator never matches", () => {
    expect(
      canModify({ actorId: "u1", allowedUserIds: [null, undefined], groupOwnerId: null }),
    ).toBe(false);
  });
});

describe("assertCanModify", () => {
  it("throws ForbiddenError with the message when not allowed", () => {
    expect(() =>
      assertCanModify({ actorId: "u1", allowedUserIds: [], groupOwnerId: "o" }, "nope"),
    ).toThrow(new ForbiddenError("nope"));
  });

  it("does nothing when allowed", () => {
    expect(() =>
      assertCanModify({ actorId: "o", allowedUserIds: [], groupOwnerId: "o" }, "nope"),
    ).not.toThrow();
  });
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement:**

```ts
import { ForbiddenError } from "@/lib/errors";

interface ModifyCheck {
  actorId: string;
  /** Users who own the item (creator, payer, assignee, ...). */
  allowedUserIds: (string | null | undefined)[];
  /** The group owner may always override. */
  groupOwnerId: string | null | undefined;
}

export function canModify({ actorId, allowedUserIds, groupOwnerId }: ModifyCheck): boolean {
  return allowedUserIds.includes(actorId) || groupOwnerId === actorId;
}

export function assertCanModify(check: ModifyCheck, message: string): void {
  if (!canModify(check)) {
    throw new ForbiddenError(message);
  }
}
```

- [ ] **Step 4: Run** → PASS. **Step 5: Commit** — `git add src/app/api/groups/permissions* && git commit -m "security: add the shared modify-permission helper"`

### Task 6.2: Expenses — creator, payer or owner

**Files:**
- Modify: `src/app/api/trips/[tripId]/expenses/repository.ts`, `.../expenses/services.ts`, `.../expenses/services.test.ts`

**Interfaces:**
- Consumes: `assertCanModify`, `findGroupOwnership` (`../../../groups/repository`, returns `{ createdById, name } | null`).
- Produces: `findExpenseSummary` additionally selects `createdById`.

- [ ] **Step 1: Tests first.** In `expenses/services.test.ts` add the mock (next to the other `vi.mock`s):

```ts
const mockFindGroupOwnership = vi.fn();
vi.mock("../../../groups/repository", () => ({
  findGroupOwnership: (...a: unknown[]) => mockFindGroupOwnership(...a),
}));
```
in the top-level `beforeEach` add `mockFindGroupOwnership.mockResolvedValue({ createdById: "owner-1", name: "Crew" });`, change the delete-test summary to `{ id: "e1", tripId: "t1", description: "Dinner", amount: 100, createdById: "u1" }`, and add:

```ts
describe("expense edit/delete permissions", () => {
  const summary = (over = {}) => ({
    id: "e1",
    tripId: "t1",
    paidById: "payer-1",
    createdById: "creator-1",
    description: "Dinner",
    amount: 100,
    ...over,
  });

  beforeEach(() => {
    mockUpdateRow.mockResolvedValue(expenseRow);
  });

  it("rejects update and delete by a member who is neither creator, payer nor owner", async () => {
    mockFindSummary.mockResolvedValue(summary());

    await expect(updateExpenseService(token, "t1", "e1", { description: "x" })).rejects.toThrow(ForbiddenError);
    await expect(deleteExpenseService(token, "t1", "e1")).rejects.toThrow(ForbiddenError);
    expect(mockUpdateRow).not.toHaveBeenCalled();
    expect(mockDeleteRow).not.toHaveBeenCalled();
  });

  it("allows the creator, the payer and the group owner", async () => {
    for (const actor of ["creator-1", "payer-1", "owner-1"]) {
      mockVerifyTripAccess.mockResolvedValue({ trip, user: { ...user, id: actor } });
      mockFindSummary.mockResolvedValue(summary());

      await expect(updateExpenseService(token, "t1", "e1", { category: "food" })).resolves.toBeDefined();
    }
  });
});
```
(`ForbiddenError` is already imported in this file via `import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors"`; add it if missing. The existing update tests use `before.paidById = "u1"` = the actor, so they stay valid.)

- [ ] **Step 2: Run** → new tests FAIL.
- [ ] **Step 3: Implement.** In `expenses/repository.ts` change `findExpenseSummary`'s select to `{ id: true, tripId: true, paidById: true, createdById: true, description: true, amount: true }`. In `expenses/services.ts` add imports `import { findGroupOwnership } from "../../../groups/repository";` and `import { assertCanModify } from "../../../groups/permissions";`, add:

```ts
async function assertCanChangeExpense(
  expense: { paidById: string | null; createdById: string | null },
  actorId: string,
  groupId: string,
) {
  const group = await findGroupOwnership(groupId);
  assertCanModify(
    {
      actorId,
      allowedUserIds: [expense.createdById, expense.paidById],
      groupOwnerId: group?.createdById,
    },
    "Only the expense creator, the payer or the group owner can change this expense",
  );
}
```
and call `await assertCanChangeExpense(before, user.id, trip.groupId);` right after `findExpenseInTrip(...)` in `updateExpenseService` and `await assertCanChangeExpense(existing, user.id, trip.groupId);` in `deleteExpenseService`.
- [ ] **Step 4: Run** `npm run test -- "src/app/api/trips/[tripId]/expenses"` → PASS. **Step 5: Commit** — `git add -A && git commit -m "security: only the creator, payer or group owner can edit or delete an expense"`

### Task 6.3: Un-marking a payment

**Files:**
- Modify: `src/app/api/trips/[tripId]/expenses/[expenseId]/payments/services.ts`, `.../payments/services.test.ts`

- [ ] **Step 1: Tests.** Add to `payments/services.test.ts`:

```ts
const mockFindGroupOwnership = vi.fn();
vi.mock("../../../../../groups/repository", () => ({
  findGroupOwnership: (...a: unknown[]) => mockFindGroupOwnership(...a),
}));
```
(path from `.../expenses/[expenseId]/payments/` to `src/app/api/groups/repository` is `../../../../../groups/repository`), set `mockFindGroupOwnership.mockResolvedValue({ createdById: "owner-1", name: "Crew" })` in the top `beforeEach`, and add inside `describe("markExpensePaidService")`:

```ts
  it("does not let a member un-mark someone else's payment", async () => {
    // caller is bob; the payment being removed is cara's
    await expect(
      markExpensePaidService(token, "t1", "e1", { memberEmail: "c@x.com", isPaid: false }),
    ).rejects.toThrow(ForbiddenError);
    expect(mockDeletePayments).not.toHaveBeenCalled();
  });

  it("lets the group owner un-mark anyone's payment", async () => {
    mockVerifyTripAccess.mockResolvedValue({
      trip: { id: "t1", groupId: "g1" },
      user: { id: "owner-1", email: "owner@x.com" },
    });

    await markExpensePaidService(token, "t1", "e1", { memberEmail: "c@x.com", isPaid: false });

    expect(mockDeletePayments).toHaveBeenCalled();
  });
```
and fix the existing "unmarking deletes the member's payment" test (it un-marks Bob as Bob — allowed — leave it). The `expense` fixture in this file has splits for alice, bob and `c@x.com`; `mockFindUserIdByEmail` resolves any email.

- [ ] **Step 2: Implement.** In `payments/services.ts` import `findGroupOwnership` (`../../../../../groups/repository`), change `const { user } = await verifyTripAccess(...)` in `markExpensePaidService` to `const { trip, user } = ...`, and after the existing self-marking check add:

```ts
  if (!data.isPaid && user.email !== data.memberEmail) {
    const group = await findGroupOwnership(trip.groupId);
    if (group?.createdById !== user.id) {
      throw new ForbiddenError("You can only un-mark your own payment");
    }
  }
```
- [ ] **Step 3: Run** the payments tests → PASS. **Step 4: Commit** — `git add -A && git commit -m "security: members can only un-mark their own payment (owner can override)"`

### Task 6.4: Member tasks — creator, assignee or owner

**Files:**
- Modify: `src/app/api/groups/[groupId]/member-tasks/repository.ts`, `.../services.ts`, `.../services.test.ts`

- [ ] **Step 1: Tests.** Add to `member-tasks/services.test.ts`:

```ts
describe("member task edit/delete permissions", () => {
  const task = (over = {}) => ({
    id: "task-1",
    groupId: "group-1",
    createdById: "creator-1",
    assignedToId: "assignee-1",
    ...over,
  });

  beforeEach(() => {
    mockFindGroupMembership.mockResolvedValue({ groupId: "group-1", userId: "user-1" });
    mockFindGroupOwnership.mockResolvedValue({ createdById: "owner-1", name: "Crew" });
    mockUpdateMemberTaskRow.mockResolvedValue({ id: "task-1" });
  });

  it("rejects update and delete by a member who is neither creator, assignee nor owner", async () => {
    mockFindMemberTaskById.mockResolvedValue(task());

    await expect(
      updateMemberTaskService(token, "group-1", "task-1", { status: "done" }),
    ).rejects.toThrow(ForbiddenError);
    await expect(deleteMemberTaskService(token, "group-1", "task-1")).rejects.toThrow(ForbiddenError);
    expect(mockUpdateMemberTaskRow).not.toHaveBeenCalled();
    expect(mockDeleteMemberTaskRow).not.toHaveBeenCalled();
  });

  it("allows the creator, the assignee and the group owner", async () => {
    for (const actor of ["creator-1", "assignee-1", "owner-1"]) {
      mockSyncUserToDatabaseService.mockResolvedValue({ ...user, id: actor });
      mockFindMemberTaskById.mockResolvedValue(task());

      await expect(
        updateMemberTaskService(token, "group-1", "task-1", { status: "done" }),
      ).resolves.toBeDefined();
    }
  });
});
```
The existing update/delete happy-path tests use owner `user-1` (set by earlier `mockFindGroupOwnership` calls in the file and equal to the actor `user-1`), so they stay green; to make that explicit, add `mockFindGroupOwnership.mockResolvedValue({ createdById: "user-1", name: "Trip Squad" });` as the first line of the two happy-path tests ("updates only the provided fields", "deletes the task when it belongs to the group") and of "throws ValidationError when reassigning to a non-member" and give those tasks `createdById: "user-1"`.

- [ ] **Step 2: Implement.** In `member-tasks/repository.ts` change `findMemberTaskById`'s select to `{ id: true, groupId: true, createdById: true, assignedToId: true }`. In `services.ts` import `assertCanModify` from `"../../permissions"`; capture the owner and user in update/delete (`const { user, group } = await verifyGroupMembership(...)`) and after the not-found check in both:

```ts
  assertCanModify(
    {
      actorId: user.id,
      allowedUserIds: [existingTask.createdById, existingTask.assignedToId],
      groupOwnerId: group.createdById,
    },
    "Only the task creator, the assignee or the group owner can change this task",
  );
```
- [ ] **Step 3: Run** `npm run test -- "src/app/api/groups"` → PASS.
- [ ] **Step 4: UI check.** Run `grep -rn "useUpdateMemberTask\|useDeleteMemberTask" src/app/components` and open the components found (Members `TasksList`): hide the delete button and the status control for tasks the current user did not create, is not assigned to, and does not own the group for. Use the same current-user/group data the page already has (`user.email`, `group.createdBy`); the server is the enforcement, the UI change is only to avoid dead buttons. Repeat for the expense edit/delete buttons in `src/app/components/pages/ExpenseDetail` (they already gate on `expense.paidBy === user?.email` / `createdBy`; extend the condition with the group owner) and for the un-mark control in the expense list/detail (visible for the member's own row, or for the group owner).
- [ ] **Step 5: Verify, commit, ship Part 6**

Run: `npx tsc --noEmit && npm run lint && npm run test`

```bash
git add -A
git commit -m "security: only creators, assignees or the group owner can change member tasks"
git push -u origin security/permissions
gh pr create --base dev --title "security: narrow who can edit expenses, payments and member tasks" --body "<summary of the three rules and the owner override; behavior change: members can no longer edit/delete each other's expenses or tasks; activities and budgets stay open; QA: edit your own vs someone else's expense, un-mark your own vs another's payment, update your assigned task vs an unrelated one, owner overrides>"
```

Poll checks, merge, `git checkout dev && git pull --ff-only`.

---

# Part 7: Dependency triage

Branch: `security/dependencies`

### Task 7.1: Triage report

**Files:**
- Create: `docs/security/dependency-audit-2026-09.md`

- [ ] **Step 1:** Run `npm audit --omit=dev --json > $CLAUDE_JOB_DIR/tmp/audit.json` and `npm audit --omit=dev` (read-only). For each **critical** and **high** advisory record: package, advisory id, installed version, whether it is a direct or transitive dependency (`npm ls <pkg>`), whether the vulnerable code runs on the server, in the browser, or at build time only, and whether a non-breaking fix exists (`npm audit fix --dry-run --omit=dev`). Write the table into the report file, grouped: **Reachable at runtime** / **Build-time or unreachable** / **Needs a breaking upgrade**.
- [ ] **Step 2: MAINTAINER.** Present the report and the exact command `npm audit fix` (non-breaking only, **never** `--force`). The maintainer runs it and commits nothing themselves; then run `npm ci` state checks: `npx tsc --noEmit && npm run lint && npm run test && npm run build:ci`.
- [ ] **Step 3:** If `npm audit fix` changed `package.json`/`package-lock.json`, commit them; list every remaining breaking upgrade in the report with its impact and a recommended follow-up, and add a "Remaining risk" line for `ws` via `socket.io-client` if it is still present.
- [ ] **Step 4: Ship Part 7**

```bash
git add docs/security package.json package-lock.json
git commit -m "security: triage dependency vulnerabilities and apply non-breaking fixes"
git push -u origin security/dependencies
gh pr create --base dev --title "security: dependency audit triage and non-breaking fixes" --body "<counts before/after, what was reachable, what remains and why>"
```

Poll checks, merge, `git checkout dev && git pull --ff-only`.

### Task 7.2: Close-out

**Files:**
- Modify: `docs/superpowers/specs/2026-09-22-code-cleanup-design.md`, `docs/superpowers/specs/2026-09-25-security-pass-design.md`, `CLAUDE.md`

- [ ] **Step 1:** In the cleanup spec's "Open follow-ups" replace the security-pass bullet with "Security pass: done (see `2026-09-25-security-pass-design.md`); residual risk: the external socket server still authenticates guests by raw group code." In `CLAUDE.md`: delete the "Things Not to Propagate" bullet about the shared admin password, and replace the `withOptionalAuth` bullet's second sentence with "Guests present a signed `X-Guest-Token`; `context.guestGroupId` is verified by the wrapper, and services must still compare it with the group/trip being accessed (see `verifyGuestTripAccess`)." Set the security spec's Status line to "Implemented".
- [ ] **Step 2:** `git add -A && git commit -m "docs: record the security pass as complete"`, push a `docs/security-closeout` branch, open a PR, merge after checks, pull `dev`.

---

## Self-Review Notes (plan vs spec)

- **Spec §1 (shared auth foundation):** Task 1.2 (revocation, error masking). The spec's `withAdmin` wrapper is intentionally replaced by extending the existing `assertAdmin` guard (Tasks 3.1–3.2, 4.1): same behavior (401 for no/invalid credentials), no rewrite of all eight admin routes, and the guard already returns the admin's email for auditing. The spec was updated to match.
- **§2 rate limiting:** Tasks 2.1–2.2 (limiters `validate-code`, `guest-join`, `reviews`, `admin-signin`).
- **§3 gateway:** Task 1.1. **§4 admin:** Tasks 3.1–3.5 (dual mode + audit + UI + production gate) and 4.1 (cutover, retired-key guard). **§5 guest tokens:** Tasks 5.1–5.5 (socket residual documented). **§6 permissions:** Tasks 6.1–6.4. **§7 headers/hygiene/deps:** Tasks 1.3, 1.4, 7.1.
- **Types used across tasks:** `assertAdmin(req): Promise<{ adminEmail: string | null }>` (Part 3) becomes `{ adminEmail: string }` in Part 4; `auditAdminAction` accepts `string | null` in Part 3 and `string` in Part 4 (Task 4.1 updates both and the audit test). `verifyGuestTripAccess(guestGroupId, tripId)` and `OptionalAuthContext.guestGroupId` are named identically in Tasks 5.2–5.3. `limit`/`withRateLimit`/`getClientIP` signatures match between Tasks 2.1 and 2.2/3.3/5.4.
