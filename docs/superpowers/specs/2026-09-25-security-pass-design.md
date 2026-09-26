# Security Pass: Admin Auth, Guest Tokens, Rate Limiting, Gateway Removal

Date: 2026-09-25
Status: Implemented on branch `security/revamp` as a single pull request (pending review and the setup steps below). Deviations from the original design: shipped as ONE PR instead of seven; the admin password path was removed directly instead of via a dual-mode transition, so `ADMIN_EMAILS` must be set before the PR is deployed; a missing `.env.example` (git-ignored) was fixed along the way. Implementation plan: `docs/superpowers/plans/2026-09-25-security-pass.md`
Scope: backend API and the few client files that talk to it. Independent of the frontend component backlog.

## Background

The code-cleanup pass (see `2026-09-22-code-cleanup-design.md`) deliberately left security untouched. Every API route is now on the repository/service layout with Zod validation, which makes this pass tractable: auth lives in a few wrappers and one guard rather than being copy-pasted.

A read-only audit found the following, ranked by severity:

1. **Admin is one shared password.** `lib/admin-auth.ts` compares with `===`, the password is stored in plain text (env var or the `AppConfig` row `admin_password`), the client keeps it in `sessionStorage` and sends it as `x-admin-password` on every admin call, `verify-password` has no rate limit, and `admin/config` can overwrite the `admin_password` row. The what's-new POST checks only the env password and ignores the DB one. Anyone with the password can delete any user.
2. **The `/api/v1/gateway` proxy is not security.** In production every client call is rewritten to it (`lib/axios.ts` + `next.config.ts`), and it re-fetches the same origin. That doubles serverless invocations and latency, only handles JSON, can be pointed at itself (recursion), and hides nothing (routes are in the bundle). Its rate limiter is in-memory.
3. **The guest credential is the raw 6-character group code** (~1.07e9 combinations). It is sent on every guest request, kept in `localStorage`, logged by the server, and `POST /api/groups/validate-code` is public with no rate limit, so it is a guessing oracle. A valid code exposes the group, its expenses and payment logs (member emails). `withOptionalAuth` puts the unverified header into `context.groupCode` and every handler must remember to re-verify it. Case handling is inconsistent (`groups/[groupId]/guest` is case-sensitive, `trips/access.ts` uppercases).
4. **`withAuth` is loose.** `verifyIdToken` is called without `checkRevoked`, so deleted or disabled users keep working until the token expires (~1h), and `firebaseDisabled` is stored but never enforced. Errors thrown by a handler are caught by the wrapper and returned as 401 "Authentication failed", hiding real 500s.
5. **Any group member can edit/delete other members' data**: member tasks, expenses, and un-marking another member's payment. Only trip deletion is creator-restricted.
6. **Missing basics.** No security headers. Rate limiting exists for reviews and the gateway only and is in-memory (ineffective on serverless). `npm audit --omit=dev` reports 31 vulnerabilities (4 critical, 15 high, incl. `ws` via socket.io-client).

Verified OK: `.env` is not tracked; uploads validate type and size; guests are read-only on every route audited.

Out of scope: the external Socket.IO server (not in this repo; it authenticates guests by raw group code), MFA for admins (Firebase can enforce it later with no code change), audit logging beyond admin actions, and the frontend component backlog.

## Decisions (made with the maintainer)

| Topic | Decision |
|---|---|
| Admin auth | Firebase login plus an `ADMIN_EMAILS` allowlist; extended `assertAdmin` guard; shared password removed after a dual-mode transition |
| Guest model | Server-signed, short-lived guest token issued by `validate-code`; guest routes stop accepting the raw code |
| Rate-limit store | Upstash Redis via `@upstash/ratelimit` |
| Member permissions | Narrow money and task actions; keep activities and budgets open |

## Design

### 1. Shared auth foundation (`lib/auth/`)

- `withAuth` / `withOptionalAuth`: authentication is done in its own `try`, the handler call is outside it, so handler errors are no longer reported as 401. `verifyIdToken(token, true)` (check revoked) is used everywhere; a revoked/disabled account gets 401 "Token has been revoked". The extra Firebase round trip per request is accepted and measured after deploy; the flag is one constant (`CHECK_REVOKED`) if it has to be narrowed to mutating routes.
- Admin identity: `lib/auth/admin.ts` exports `isAdminEmail(email, emailVerified)`: true only for a **verified** Firebase email on the `ADMIN_EMAILS` allowlist (comma-separated, case-insensitive). Instead of a separate `withAdmin` HOF (which would mean rewriting all eight admin routes), the existing `assertAdmin(req)` guard from the cleanup pass is extended: it verifies the Firebase Bearer token (with revocation check), applies `isAdminEmail`, and returns `{ adminEmail }` for the audit log. No/invalid credentials: 401.

### 2. Rate limiting (`lib/rate-limit.ts`)

Rewritten around Upstash. One function: `limit(name, key): Promise<{ allowed, remaining, resetTime }>`, backed by `@upstash/ratelimit` sliding windows configured per limiter name. Behavior:
- Redis env vars unset (local dev) or Redis unreachable: **fail open**, log a warning once. Availability of the app beats availability of the limiter.
- Client key is the first `x-forwarded-for` hop (trusted on Vercel; documented as spoofable elsewhere), falling back to `x-real-ip`.
- `withRateLimit(name, handler)` helper returns the standard 429 JSON with `Retry-After`.
- Limiters (initial values, tunable in one file): `validate-code` 10/min, `guest-join` 20/min, `reviews` 10/hour (existing), `admin-signin` 10/10 min per IP (applied to the admin identity check route so an allowlisted admin's own sign-in flow can't be used to hammer it).

### 3. Gateway removal

Delete `src/app/api/v1/gateway/route.ts`, the `/api/wanderly-api` rewrite, the gateway branch of `lib/axios.ts`, `NEXT_PUBLIC_ENABLE_GATEWAY`, `gatewayRateLimiter`, and the mentions in `.agent/*` and `CLAUDE.md`. Browser tabs opened before the deploy will get 404s from `/api/wanderly-api` until reloaded (acceptable, documented in the PR).

### 4. Admin via Firebase

- **Transition (PR 3):** `assertAdmin` accepts (a) a valid `Authorization: Bearer` token whose email is allowlisted, or (b) the legacy password header. Admin pages send the Firebase token (through the existing axios instance/`getToken`) and fall back to nothing else. The `/admin` login screen becomes: if signed in and allowlisted, show the admin UI; if signed in and not allowlisted, "Not authorised"; if signed out, link to the existing sign-in flow. New `GET /api/admin/me` returns `{ email }` for admins and replaces `verify-password` for the UI.
- **Audit log:** destructive admin actions (`DELETE users/[id]`, `db/maintenance`, config `POST`, what's-new `POST`) emit a structured `logger.warn("Admin action", { admin, action, target })`.
- **Cutover (PR 4):** remove the password path entirely: `verifyAdminPassword`, `lib/admin-auth.ts`, `admin/verify-password`, the `admin_password` row usage, `scripts/sync-admin-password.ts`, the `ADMIN_PASSWORD` env requirement, and the `sessionStorage` password. The what's-new POST moves onto `assertAdmin` in PR 3 already. `admin/config` refuses to read or write the `admin_password` key (defensive, so a stale row can never become a credential again).
- **Lockout guard:** PR 3 ships behind the legacy path so a wrong `ADMIN_EMAILS` value cannot lock anyone out; PR 4 is merged only after the maintainer confirms admin login works with Firebase in production.

### 5. Signed guest tokens

- `lib/auth/guest-token.ts`: `signGuestToken({ groupId }, ttl)` / `verifyGuestToken(token)` using `node:crypto` HMAC-SHA256 with `GUEST_TOKEN_SECRET` (no new dependency). Payload: `{ gid, iat, exp }`, base64url, `payload.signature`. Constant-time signature comparison; rejects expired or malformed tokens. TTL 24 hours.
- `POST /api/groups/validate-code`: rate limited (`validate-code`), case-normalised to uppercase, **no longer logs the code**, returns `{ groupId, groupName, guestToken }` (the existing `code` field is dropped from the response).
- `withOptionalAuth`: reads `X-Guest-Token`; a valid token yields `{ isGuest: true, guestGroupId }` in the context. The raw `X-Guest-Code` header is removed. `context.groupCode` is deleted from `OptionalAuthContext`.
- Guest services compare `guestGroupId` to the group/trip actually accessed (`verifyGuestTripAccess(guestGroupId, tripId)` replaces the code comparison), which closes the "handler must re-verify" trust gap in `CLAUDE.md`. The case-sensitivity inconsistency disappears because codes are only compared inside `validate-code`.
- Client: `lib/guest-session.ts` stores `{ groupId, guestName, guestToken, groupCode }`. The token is sent as `X-Guest-Token` by `lib/axios.ts`. The code stays in `localStorage` only so the client can silently re-validate when the token expires or a request returns 401 (one rate-limited endpoint); it is never sent on data requests. Existing sessions that only have a code upgrade themselves on first use.
- **Socket dependency:** `lib/socket.ts` sends `groupCode` to the external socket server. Until that server is changed to accept `guestToken`, the client keeps sending the code to the socket handshake only. This is called out as a known residual risk and tracked as a follow-up outside this repo.
- Revocation: there is no "regenerate group code" feature today, so a token lives until it expires (24h). If regenerate is added later, a `cv` (code-version) claim can be added to tokens; not built now (YAGNI).

### 6. Narrowed permissions

Rules are enforced in services (they already receive the acting user), with typed `ForbiddenError`s, and the group owner may override every rule:
- Expenses: update/delete only by `createdById` or `paidById`.
- Expense payments: un-marking (`isPaid: false`) only for the member themselves. (Marking paid is already self-only.)
- Member tasks: PATCH/DELETE only by the task's creator, the assignee, or the group owner.
- Activities and budgets remain open to all members (collaborative planning).

A shared `assertCanModify({ actorId, ownerIds, groupOwnerId })` helper in `src/app/api/groups/permissions.ts` keeps the rule in one tested place. The UI already hides edit controls in several places; the PR checks each affected screen and hides the rest.

### 7. Headers and hygiene

- `next.config.ts` `headers()`: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic/geo off), `Strict-Transport-Security`, and a **`Content-Security-Policy-Report-Only`** allowing self, Firebase, Cloudinary images, and the socket origin. Enforcing CSP is a follow-up once the report-only output is clean.
- `.env.example` documenting every variable, including the new ones (`ADMIN_EMAILS`, `GUEST_TOKEN_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`).
- Dependencies: triage the 4 critical / 15 high findings by reachability (server vs. client, prod vs. build-only). Non-breaking fixes are applied with `npm audit fix` run by the maintainer; breaking upgrades are listed, not forced.

## PR sequence (each merged and `dev` pulled before the next)

1. Gateway removal, `withAuth` error/revocation fix, security headers, `.env.example`.
2. Upstash rate limiting; applied to `validate-code`, `groups/join`, `reviews`, `admin/me`.
3. Firebase-admin `assertAdmin` + dual mode + audit log + admin UI on Firebase login.
4. Admin cutover: remove the password path (after production confirmation).
5. Signed guest tokens (server and client).
6. Narrowed permissions.
7. Dependency triage and fixes.

## Manual steps the maintainer performs (called out in each PR)

- Create an Upstash Redis database; set `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` in Vercel and `.env`; run `npm i @upstash/ratelimit @upstash/redis` (PR 2).
- Set `ADMIN_EMAILS` in every environment before PR 3 deploys (PR 3).
- Set `GUEST_TOKEN_SECRET` (32+ random bytes, e.g. `openssl rand -base64 32`) in every environment before PR 5 deploys (PR 5).
- Run `npm audit fix` and review the resulting lockfile diff (PR 7).
- After PR 3: verify admin login in production before approving PR 4.

## Testing strategy

- Pure units get Vitest tests: guest-token sign/verify (tampering, expiry, wrong secret, malformed), `assertAdmin` and `isAdminEmail` (missing/invalid/unverified/non-allowlisted/allowlisted), `assertCanModify`, rate-limit fail-open behavior and key extraction, allowlist parsing (case, whitespace, empty).
- Wrapper tests extend `lib/auth/with-auth.test.ts` (handler errors are not 401; revoked token is 401).
- Services get tests for each narrowed permission (creator, payer, assignee, owner, other member).
- No live QA is possible in the agent sandbox: each PR lists the flows to click through (admin sign-in, guest join on a clean browser, guest join with a pre-existing session, member editing another member's expense).

## Risks

- **Admin lockout** (PR 3/4): mitigated by dual mode and an explicit production check before removal.
- **Socket server still trusts the raw code**: residual risk until that server is updated; the token change still removes the code from every HTTP request and log.
- **`checkRevoked` latency**: measured after PR 1; the constant allows narrowing.
- **Stale browser tabs** after gateway removal and after the guest-token change: need a reload; the guest client's silent re-validation covers guests.
- **Permission narrowing changes behavior** members may rely on (e.g. editing a friend's expense). The PR description says so explicitly.
