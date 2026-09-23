# Groups Core Feature Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the "Groups core" sub-unit (group CRUD, join, validate-code, leave, guest access — 6 routes, `src/app/api/groups/services.ts`) to the repository/service/route architecture, and extend `lib/auth/with-auth.ts` so migrated routes can finally use Next's `context.params` instead of manual path parsing.

**Architecture:** `src/app/api/groups/services.ts` (697 lines, 8 functions) currently calls Prisma directly and repeats the same 20-line `include` block six times. Extract a single shared `GROUP_DETAIL_INCLUDE` constant plus granular query/mutation functions into `repository.ts`; rewrite `services.ts` to use them and throw typed errors from `lib/errors.ts` instead of plain `Error` + string-matching in route catch blocks; add Zod schemas for all request bodies. A prerequisite: `withAuth`/`withOptionalAuth` currently drop Next's second (route-params) argument entirely, so no route wrapped by them can adopt `context.params` yet — Task 1 fixes that once, for every route in the app that uses these wrappers (24 files), additively and backward-compatibly.

**Tech Stack:** Next.js 15 App Router, Prisma, Zod, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-22-code-cleanup-design.md`

**Depends on:** Foundation (`lib/errors.ts`, `lib/handle-api-error.ts`) must be on the branch this forks from.

**Out of scope (separate sub-units, queued right after this one — see spec):** Group Member Tasks (`[groupId]/member-tasks/**`) and Group's nested Trips resource (`[groupId]/trips/**`). Do not touch those files. Also out of scope: the guest-code trust-boundary/security work (separate security pass) and the `member-tasks`/nested-`trips` files' own `getOrCreateUser`/membership-check duplication (noted for a future pass, not fixed here).

## Global Constraints

- No AI/Claude Code attribution in commit messages or PR descriptions.
- One branch/PR (`refactor/groups-core-service-repo`), left fully working at the end.
- `syncUserToDatabaseService`, `createNotificationService`, and the dynamic `import("@/lib/socket-events")` emit calls are external dependencies — call them as-is, do not modify them or move them out of `services.ts` (they're business-logic-adjacent side effects, not pure DB access, so they belong in the service layer, not the repository).
- The `lib/auth/with-auth.ts` change (Task 1) must not break any of the other 23 files currently calling `withAuth`/`withOptionalAuth` with a 2-argument handler — verify this by running the full test suite and `npx tsc --noEmit` after that change, before touching anything else.
- No behavior change beyond: (a) request bodies now validated with Zod before reaching a service (same effective validation — e.g. name min-length 5 — but error response body shape now matches `handleApiError`'s ZodError branch); (b) unexpected errors return a generic message instead of leaking `error.message`; (c) group `trips` are now consistently ordered by `createdAt desc` in every group-fetching path — 3 of the 8 original service functions (`createGroupService`, `joinGroupService`, `listGroupsService`) omitted this ordering while the other 5 had it; unifying behind one shared `include` constant makes this consistent. This is a minor, low-risk normalization (a newly created group has 0 trips; join/list only affects array ordering in an already-small list) — call it out explicitly in the PR description as its own bullet, don't bury it in (a)/(b).

---

### Task 1: Extend `withAuth`/`withOptionalAuth` to forward Next's route context

**Files:**
- Modify: `lib/auth/with-auth.ts`
- Create: `lib/auth/with-auth.test.ts`

**Interfaces:**
- Produces: `RouteContext<Params>` type (`{ params: Promise<Params> }`) exported from `lib/auth/with-auth.ts`. `withAuth`/`withOptionalAuth` handlers may now optionally declare a third parameter of this type to receive Next's dynamic route params. Existing 2-argument handlers continue to work unchanged (TypeScript's function-parameter contravariance makes a 2-param function assignable where a 3-param function type is expected; the extra argument is simply never referenced).

- [ ] **Step 1: Write the failing tests**

Create `lib/auth/with-auth.test.ts`:

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockVerifyIdToken = vi.fn();

vi.mock("../firebase-admin", () => ({
  userAuth: {
    verifyIdToken: (...args: unknown[]) => mockVerifyIdToken(...args),
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const { withAuth, withOptionalAuth } = await import("./with-auth");

function makeRequest(headers: Record<string, string> = {}) {
  const lower = Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]),
  );
  return {
    headers: { get: (key: string) => lower[key.toLowerCase()] ?? null },
    nextUrl: { pathname: "/api/test" },
  } as unknown as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("withAuth", () => {
  it("returns 401 without calling the handler when no Authorization header is present", async () => {
    const handler = vi.fn();
    const wrapped = withAuth(handler);

    const response = await wrapped(makeRequest());

    expect(response.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("calls a 2-arg handler with (req, authContext) for routes with no dynamic segments", async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: "user-1", email: "user@example.com" });
    const handler = vi.fn().mockResolvedValue(NextResponse.json(null));
    const wrapped = withAuth(handler);

    await wrapped(makeRequest({ Authorization: "Bearer token123" }));

    expect(handler).toHaveBeenCalledTimes(1);
    const [, authContext] = handler.mock.calls[0];
    expect(authContext.uid).toBe("user-1");
  });

  it("forwards the route context (params) through to a 3-arg handler", async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: "user-1" });
    const handler = vi.fn().mockResolvedValue(NextResponse.json(null));
    const wrapped = withAuth(handler);
    const routeContext = { params: Promise.resolve({ groupId: "g1" }) };

    await wrapped(makeRequest({ Authorization: "Bearer token123" }), routeContext);

    expect(handler).toHaveBeenCalledTimes(1);
    const [, , forwardedRouteContext] = handler.mock.calls[0];
    expect(forwardedRouteContext).toBe(routeContext);
    await expect(forwardedRouteContext.params).resolves.toEqual({ groupId: "g1" });
  });
});

describe("withOptionalAuth", () => {
  it("forwards the route context through to the handler alongside guest context", async () => {
    const handler = vi.fn().mockResolvedValue(NextResponse.json(null));
    const wrapped = withOptionalAuth(handler);
    const routeContext = { params: Promise.resolve({ groupId: "g1" }) };

    await wrapped(
      makeRequest({ "X-Guest-Code": "ABC123" }),
      routeContext,
    );

    expect(handler).toHaveBeenCalledTimes(1);
    const [, guestContext, forwardedRouteContext] = handler.mock.calls[0];
    expect(guestContext.isGuest).toBe(true);
    expect(guestContext.groupCode).toBe("ABC123");
    expect(forwardedRouteContext).toBe(routeContext);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- lib/auth/with-auth.test.ts`
Expected: FAIL — the route-context forwarding tests fail because the current implementation's returned function only declares `(req: NextRequest)` and never passes a third argument to `handler`.

- [ ] **Step 3: Extend the implementation**

In `lib/auth/with-auth.ts`, add this export near the top (after `AuthContext`):

```ts
export interface RouteContext<
  Params extends Record<string, string> = Record<string, string>,
> {
  params: Promise<Params>;
}
```

Change the `withAuth` function signature and returned wrapper:

```ts
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
    try {
      // ... existing body is unchanged down to the handler call ...
```

And change only the final call inside the `try` block from:

```ts
      return await handler(req, authContext);
```

to:

```ts
      return await handler(req, authContext, routeContext as RouteContext<Params>);
```

Do the same for `withOptionalAuth`. Its current signature is:

```ts
export function withOptionalAuth(
  handler: (
    req: NextRequest,
    context: OptionalAuthContext,
  ) => Promise<NextResponse>,
) {
  return async (req: NextRequest): Promise<NextResponse> => {
```

Change it to:

```ts
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
```

Then change its two `return await handler(req, ...)` call sites — the authenticated-token branch (`return await handler(req, authContext);`) and the guest branch (`return await handler(req, guestContext);`) — to each pass the third argument:

```ts
            return await handler(req, authContext, routeContext as RouteContext<Params>);
```

and

```ts
        return await handler(req, guestContext, routeContext as RouteContext<Params>);
```

respectively. Everything else in `withOptionalAuth` (the token-fallback try/catch, the guest-code check, the final 401) stays exactly as it is.

Leave `withBasicAuth` alone — it's a thin pass-through to `withAuth` (`return withAuth(handler);`) and inherits the change automatically once `withAuth`'s type signature is updated, since it takes the same `handler` shape.

Do not change anything else in the file — auth logic, error responses, and logging all stay exactly as they are.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test -- lib/auth/with-auth.test.ts`
Expected: PASS — 4 tests passed.

- [ ] **Step 5: Verify nothing else in the app broke**

Run: `npm run test && npx tsc --noEmit`
Expected: full suite passes (should be the same count as before plus these 4 new tests — no regressions), no type errors anywhere, including in the other 23 files that call `withAuth`/`withOptionalAuth` with 2-argument handlers.

- [ ] **Step 6: Commit**

```bash
git add lib/auth/with-auth.ts lib/auth/with-auth.test.ts
git commit -m "feat: forward Next route context through withAuth/withOptionalAuth"
```

---

### Task 2: Repository, schemas, and services

**Files:**
- Create: `src/app/api/groups/repository.ts`
- Create: `src/app/api/groups/schemas.ts`
- Modify: `src/app/api/groups/services.ts`
- Create: `src/app/api/groups/services.test.ts`

**Interfaces:**
- Consumes: `NotFoundError`, `ForbiddenError`, `ValidationError` from `@/lib/errors`; `RouteContext` from `@/lib/auth/with-auth` (used in Task 3, not here).
- Produces: `GROUP_DETAIL_INCLUDE`, `GroupWithDetail`, `findGroupById`, `findGroupByCode`, `findGroupCodeLookup`, `findGroupOwnership`, `findGroupMembership`, `findGroupWithMembership`, `listGroupMembersForNotify`, `listGroupMembershipsForUser`, `createGroupRow`, `addGroupMember`, `removeGroupMember`, `updateGroupRow`, `deleteGroupRow` from `repository.ts`. `createGroupSchema`, `updateGroupSchema`, `joinGroupSchema`, `validateCodeSchema` from `schemas.ts`. Service function names/signatures unchanged from today except `createGroupService`/`updateGroupService` now take a parsed schema object instead of loose positional args (Task 3's route rewrite is the only caller, so this is safe).

- [ ] **Step 1: Create the repository**

Create `src/app/api/groups/repository.ts`:

```ts
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const GROUP_DETAIL_INCLUDE = {
  creator: { select: { id: true, name: true, email: true } },
  members: {
    include: {
      user: { select: { id: true, name: true, email: true, imageUrl: true } },
    },
  },
  trips: {
    include: {
      activities: true,
      creator: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" as const },
  },
} satisfies Prisma.GroupInclude;

export type GroupWithDetail = Prisma.GroupGetPayload<{
  include: typeof GROUP_DETAIL_INCLUDE;
}>;

export function findGroupById(groupId: string) {
  return prisma.group.findUnique({
    where: { id: groupId },
    include: GROUP_DETAIL_INCLUDE,
  });
}

export function findGroupByCode(code: string) {
  return prisma.group.findUnique({
    where: { code },
    include: GROUP_DETAIL_INCLUDE,
  });
}

export function findGroupCodeLookup(code: string) {
  return prisma.group.findUnique({
    where: { code },
    select: { id: true, name: true, code: true },
  });
}

export function findGroupOwnership(groupId: string) {
  return prisma.group.findUnique({
    where: { id: groupId },
    select: { createdById: true, name: true },
  });
}

export function findGroupMembership(groupId: string, userId: string) {
  return prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
}

export function findGroupWithMembership(groupId: string, userId: string) {
  return prisma.group.findUnique({
    where: { id: groupId },
    include: { members: { where: { userId } } },
  });
}

export function listGroupMembersForNotify(groupId: string) {
  return prisma.groupMember.findMany({
    where: { groupId },
    include: { user: { select: { id: true, email: true } } },
  });
}

export function listGroupMembershipsForUser(userId: string) {
  return prisma.groupMember.findMany({
    where: { userId },
    include: { group: { include: GROUP_DETAIL_INCLUDE } },
    orderBy: { group: { createdAt: "desc" } },
  });
}

export interface CreateGroupRow {
  name: string;
  code: string;
  colorScheme: string;
  emoji: string | null;
  createdById: string;
}

export function createGroupRow(data: CreateGroupRow) {
  return prisma.group.create({
    data: {
      name: data.name,
      code: data.code,
      colorScheme: data.colorScheme,
      emoji: data.emoji,
      createdById: data.createdById,
      members: { create: { userId: data.createdById, role: "admin" } },
    },
    include: GROUP_DETAIL_INCLUDE,
  });
}

export function addGroupMember(groupId: string, userId: string, role: string) {
  return prisma.groupMember.create({ data: { groupId, userId, role } });
}

export function removeGroupMember(groupId: string, userId: string) {
  return prisma.groupMember.delete({
    where: { groupId_userId: { groupId, userId } },
  });
}

export interface UpdateGroupRow {
  name?: string;
  colorScheme?: string;
  emoji?: string | null;
}

export function updateGroupRow(groupId: string, data: UpdateGroupRow) {
  return prisma.group.update({
    where: { id: groupId },
    data,
    include: GROUP_DETAIL_INCLUDE,
  });
}

export function deleteGroupRow(groupId: string) {
  return prisma.group.delete({ where: { id: groupId } });
}
```

(No test file for this one — thin Prisma passthroughs aren't unit tested in this pass, per the design spec's testing strategy.)

- [ ] **Step 2: Create the Zod schemas**

Create `src/app/api/groups/schemas.ts`:

```ts
import { z } from "zod";

export const createGroupSchema = z.object({
  name: z.string().trim().min(5, "Group name must be at least 5 characters"),
  colorScheme: z.string().default("orange"),
  emoji: z.string().nullable().default(null),
});
export type CreateGroupBody = z.infer<typeof createGroupSchema>;

export const updateGroupSchema = z
  .object({
    name: z.string().trim().min(5, "Group name must be at least 5 characters").optional(),
    colorScheme: z.string().optional(),
    emoji: z.string().nullable().optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.colorScheme !== undefined ||
      data.emoji !== undefined,
    { message: "At least one field (name, colorScheme, or emoji) must be provided" },
  );
export type UpdateGroupBody = z.infer<typeof updateGroupSchema>;

export const joinGroupSchema = z.object({
  groupCode: z.string().trim().min(1, "Group code is required"),
});
export type JoinGroupBody = z.infer<typeof joinGroupSchema>;

export const validateCodeSchema = z.object({
  code: z.string().trim().min(1, "Group code is required"),
});
export type ValidateCodeBody = z.infer<typeof validateCodeSchema>;
```

- [ ] **Step 3: Write the failing tests for the services**

Create `src/app/api/groups/services.test.ts`:

```ts
import type { DecodedIdToken } from "firebase-admin/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";

const mockFindGroupById = vi.fn();
const mockFindGroupByCode = vi.fn();
const mockFindGroupCodeLookup = vi.fn();
const mockFindGroupOwnership = vi.fn();
const mockFindGroupMembership = vi.fn();
const mockFindGroupWithMembership = vi.fn();
const mockListGroupMembersForNotify = vi.fn();
const mockListGroupMembershipsForUser = vi.fn();
const mockCreateGroupRow = vi.fn();
const mockAddGroupMember = vi.fn();
const mockRemoveGroupMember = vi.fn();
const mockUpdateGroupRow = vi.fn();
const mockDeleteGroupRow = vi.fn();

vi.mock("./repository", () => ({
  findGroupById: (...a: unknown[]) => mockFindGroupById(...a),
  findGroupByCode: (...a: unknown[]) => mockFindGroupByCode(...a),
  findGroupCodeLookup: (...a: unknown[]) => mockFindGroupCodeLookup(...a),
  findGroupOwnership: (...a: unknown[]) => mockFindGroupOwnership(...a),
  findGroupMembership: (...a: unknown[]) => mockFindGroupMembership(...a),
  findGroupWithMembership: (...a: unknown[]) => mockFindGroupWithMembership(...a),
  listGroupMembersForNotify: (...a: unknown[]) => mockListGroupMembersForNotify(...a),
  listGroupMembershipsForUser: (...a: unknown[]) => mockListGroupMembershipsForUser(...a),
  createGroupRow: (...a: unknown[]) => mockCreateGroupRow(...a),
  addGroupMember: (...a: unknown[]) => mockAddGroupMember(...a),
  removeGroupMember: (...a: unknown[]) => mockRemoveGroupMember(...a),
  updateGroupRow: (...a: unknown[]) => mockUpdateGroupRow(...a),
  deleteGroupRow: (...a: unknown[]) => mockDeleteGroupRow(...a),
}));

const mockSyncUserToDatabaseService = vi.fn();
vi.mock("../sync/syncService", () => ({
  syncUserToDatabaseService: (...a: unknown[]) => mockSyncUserToDatabaseService(...a),
}));

const mockCreateNotificationService = vi.fn();
vi.mock("../notifications/services", () => ({
  createNotificationService: (...a: unknown[]) => mockCreateNotificationService(...a),
}));

const mockGenerateUniqueGroupCode = vi.fn();
vi.mock("@/lib/utils/groupCode", () => ({
  generateUniqueGroupCode: (...a: unknown[]) => mockGenerateUniqueGroupCode(...a),
}));

vi.mock("@/lib/socket-events", () => ({
  emitGroupUpdated: vi.fn().mockResolvedValue(undefined),
  emitGroupDeleted: vi.fn().mockResolvedValue(undefined),
}));

const {
  createGroupService,
  deleteGroupService,
  getGroupByIdForGuestService,
  getGroupByIdService,
  joinGroupService,
  leaveGroupService,
  listGroupsService,
  updateGroupService,
  validateGroupCodeService,
} = await import("./services");

const token = { uid: "firebase-1" } as DecodedIdToken;
const user = { id: "user-1", name: "Alice", email: "alice@example.com" };

beforeEach(() => {
  vi.clearAllMocks();
  mockSyncUserToDatabaseService.mockResolvedValue(user);
});

describe("createGroupService", () => {
  it("generates a code, creates the group with the creator as admin, and returns it", async () => {
    mockGenerateUniqueGroupCode.mockResolvedValue("ABC123");
    mockCreateGroupRow.mockResolvedValue({ id: "group-1", code: "ABC123" });

    const result = await createGroupService(token, {
      name: "Trip Squad",
      colorScheme: "blue",
      emoji: "✈️",
    });

    expect(mockCreateGroupRow).toHaveBeenCalledWith({
      name: "Trip Squad",
      code: "ABC123",
      colorScheme: "blue",
      emoji: "✈️",
      createdById: "user-1",
    });
    expect(result).toEqual({ id: "group-1", code: "ABC123" });
  });
});

describe("joinGroupService", () => {
  it("throws NotFoundError when the code doesn't match a group", async () => {
    mockFindGroupByCode.mockResolvedValue(null);

    await expect(joinGroupService(token, "NOPE")).rejects.toThrow(NotFoundError);
  });

  it("throws ValidationError when the user is already a member", async () => {
    mockFindGroupByCode.mockResolvedValue({ id: "group-1", name: "Trip Squad" });
    mockFindGroupMembership.mockResolvedValue({ groupId: "group-1", userId: "user-1" });

    await expect(joinGroupService(token, "ABC123")).rejects.toThrow(ValidationError);
    expect(mockAddGroupMember).not.toHaveBeenCalled();
  });

  it("adds the member and notifies existing members, excluding the joiner", async () => {
    mockFindGroupByCode.mockResolvedValue({ id: "group-1", name: "Trip Squad" });
    mockFindGroupMembership.mockResolvedValue(null);
    mockFindGroupById.mockResolvedValue({ id: "group-1", name: "Trip Squad" });
    mockListGroupMembersForNotify.mockResolvedValue([
      { userId: "user-1", user: { id: "user-1", email: "alice@example.com" } },
      { userId: "user-2", user: { id: "user-2", email: "bob@example.com" } },
    ]);

    await joinGroupService(token, "ABC123");

    expect(mockAddGroupMember).toHaveBeenCalledWith("group-1", "user-1", "member");
    expect(mockCreateNotificationService).toHaveBeenCalledTimes(1);
    expect(mockCreateNotificationService).toHaveBeenCalledWith(
      "user-2",
      expect.objectContaining({ relatedGroupId: "group-1" }),
    );
  });
});

describe("listGroupsService", () => {
  it("maps memberships to their groups", async () => {
    mockListGroupMembershipsForUser.mockResolvedValue([
      { group: { id: "group-1" } },
      { group: { id: "group-2" } },
    ]);

    const result = await listGroupsService(token);

    expect(mockListGroupMembershipsForUser).toHaveBeenCalledWith("user-1");
    expect(result).toEqual([{ id: "group-1" }, { id: "group-2" }]);
  });
});

describe("getGroupByIdService", () => {
  it("throws ForbiddenError when the user isn't a member", async () => {
    mockFindGroupMembership.mockResolvedValue(null);

    await expect(getGroupByIdService(token, "group-1")).rejects.toThrow(ForbiddenError);
  });

  it("throws NotFoundError when the membership exists but the group doesn't", async () => {
    mockFindGroupMembership.mockResolvedValue({ groupId: "group-1", userId: "user-1" });
    mockFindGroupById.mockResolvedValue(null);

    await expect(getGroupByIdService(token, "group-1")).rejects.toThrow(NotFoundError);
  });

  it("returns the group when membership and group both exist", async () => {
    mockFindGroupMembership.mockResolvedValue({ groupId: "group-1", userId: "user-1" });
    mockFindGroupById.mockResolvedValue({ id: "group-1" });

    const result = await getGroupByIdService(token, "group-1");

    expect(result).toEqual({ id: "group-1" });
  });
});

describe("leaveGroupService", () => {
  it("throws ForbiddenError when the user isn't a member", async () => {
    mockFindGroupMembership.mockResolvedValue(null);

    await expect(leaveGroupService(token, "group-1")).rejects.toThrow(ForbiddenError);
  });

  it("throws ValidationError when the creator tries to leave", async () => {
    mockFindGroupMembership.mockResolvedValue({ groupId: "group-1", userId: "user-1" });
    mockFindGroupOwnership.mockResolvedValue({ createdById: "user-1", name: "Trip Squad" });

    await expect(leaveGroupService(token, "group-1")).rejects.toThrow(ValidationError);
    expect(mockRemoveGroupMember).not.toHaveBeenCalled();
  });

  it("removes the membership and notifies remaining members when a non-creator leaves", async () => {
    mockFindGroupMembership.mockResolvedValue({ groupId: "group-1", userId: "user-1" });
    mockFindGroupOwnership.mockResolvedValue({ createdById: "someone-else", name: "Trip Squad" });
    mockListGroupMembersForNotify.mockResolvedValue([
      { userId: "user-1", user: { id: "user-1", email: "alice@example.com" } },
      { userId: "someone-else", user: { id: "someone-else", email: "owner@example.com" } },
    ]);
    mockFindGroupById.mockResolvedValue({ id: "group-1" });

    await leaveGroupService(token, "group-1");

    expect(mockRemoveGroupMember).toHaveBeenCalledWith("group-1", "user-1");
    expect(mockCreateNotificationService).toHaveBeenCalledTimes(1);
    expect(mockCreateNotificationService).toHaveBeenCalledWith(
      "someone-else",
      expect.objectContaining({ relatedGroupId: "group-1" }),
    );
  });
});

describe("deleteGroupService", () => {
  it("throws ForbiddenError when the user isn't the creator", async () => {
    mockFindGroupOwnership.mockResolvedValue({ createdById: "someone-else" });

    await expect(deleteGroupService(token, "group-1")).rejects.toThrow(ForbiddenError);
    expect(mockDeleteGroupRow).not.toHaveBeenCalled();
  });

  it("deletes the group when the user is the creator", async () => {
    mockFindGroupOwnership.mockResolvedValue({ createdById: "user-1" });

    await deleteGroupService(token, "group-1");

    expect(mockDeleteGroupRow).toHaveBeenCalledWith("group-1");
  });
});

describe("updateGroupService", () => {
  it("throws ForbiddenError when the user is a member but neither creator nor admin", async () => {
    mockFindGroupWithMembership.mockResolvedValue({
      createdById: "someone-else",
      members: [{ userId: "user-1", role: "member" }],
    });

    await expect(
      updateGroupService(token, "group-1", { name: "New Name" }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("allows an admin member (non-creator) to update", async () => {
    mockFindGroupWithMembership.mockResolvedValue({
      createdById: "someone-else",
      members: [{ userId: "user-1", role: "admin" }],
    });
    mockUpdateGroupRow.mockResolvedValue({ id: "group-1", name: "New Name" });

    const result = await updateGroupService(token, "group-1", { name: "New Name" });

    expect(mockUpdateGroupRow).toHaveBeenCalledWith("group-1", { name: "New Name" });
    expect(result).toEqual({ id: "group-1", name: "New Name" });
  });
});

describe("getGroupByIdForGuestService", () => {
  it("throws NotFoundError when the group doesn't exist", async () => {
    mockFindGroupById.mockResolvedValue(null);

    await expect(getGroupByIdForGuestService("ABC123", "group-1")).rejects.toThrow(
      NotFoundError,
    );
  });

  it("throws ForbiddenError when the code doesn't match", async () => {
    mockFindGroupById.mockResolvedValue({ id: "group-1", code: "REAL123" });

    await expect(getGroupByIdForGuestService("WRONG", "group-1")).rejects.toThrow(
      ForbiddenError,
    );
  });

  it("returns the group when the code matches", async () => {
    mockFindGroupById.mockResolvedValue({ id: "group-1", code: "ABC123" });

    const result = await getGroupByIdForGuestService("ABC123", "group-1");

    expect(result).toEqual({ id: "group-1", code: "ABC123" });
  });
});

describe("validateGroupCodeService", () => {
  it("throws NotFoundError when no group matches the code", async () => {
    mockFindGroupCodeLookup.mockResolvedValue(null);

    await expect(validateGroupCodeService("NOPE")).rejects.toThrow(NotFoundError);
  });

  it("returns the group lookup when found", async () => {
    mockFindGroupCodeLookup.mockResolvedValue({ id: "group-1", name: "Trip Squad", code: "ABC123" });

    const result = await validateGroupCodeService("ABC123");

    expect(result).toEqual({ id: "group-1", name: "Trip Squad", code: "ABC123" });
  });
});
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `npm run test -- src/app/api/groups/services.test.ts`
Expected: FAIL — `services.ts` doesn't yet export `validateGroupCodeService`, doesn't accept a schema object for `createGroupService`, and still calls `prisma` directly instead of the mocked repository functions.

- [ ] **Step 5: Rewrite the services**

Replace the full contents of `src/app/api/groups/services.ts`:

```ts
import { logger } from "@/lib/logger";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import type { DecodedIdToken } from "firebase-admin/auth";
import { NotificationType } from "@prisma/client";
import { syncUserToDatabaseService } from "../sync/syncService";
import { generateUniqueGroupCode } from "@/lib/utils/groupCode";
import { createNotificationService } from "../notifications/services";
import {
  addGroupMember,
  createGroupRow,
  deleteGroupRow,
  findGroupByCode,
  findGroupById,
  findGroupCodeLookup,
  findGroupMembership,
  findGroupOwnership,
  findGroupWithMembership,
  listGroupMembersForNotify,
  listGroupMembershipsForUser,
  removeGroupMember,
  updateGroupRow,
} from "./repository";
import type { CreateGroupBody, UpdateGroupBody } from "./schemas";

async function getOrCreateUser(token: DecodedIdToken) {
  return syncUserToDatabaseService(token);
}

export async function createGroupService(token: DecodedIdToken, input: CreateGroupBody) {
  const user = await getOrCreateUser(token);
  const code = await generateUniqueGroupCode();

  const group = await createGroupRow({
    name: input.name,
    code,
    colorScheme: input.colorScheme,
    emoji: input.emoji,
    createdById: user.id,
  });

  const { emitGroupUpdated } = await import("@/lib/socket-events");
  emitGroupUpdated(group.id, group).catch((err) => {
    logger.error("Failed to emit group created event", { error: err });
  });

  logger.info("Group created", { groupId: group.id, code: group.code });
  return group;
}

export async function joinGroupService(token: DecodedIdToken, groupCode: string) {
  const user = await getOrCreateUser(token);

  const group = await findGroupByCode(groupCode);
  if (!group) {
    throw new NotFoundError("Group not found");
  }

  const existingMembership = await findGroupMembership(group.id, user.id);
  if (existingMembership) {
    throw new ValidationError("User is already a member of this group");
  }

  await addGroupMember(group.id, user.id, "member");

  const updatedGroup = await findGroupById(group.id);

  const allMembers = await listGroupMembersForNotify(group.id);
  const notificationPromises = allMembers
    .filter((member) => member.userId !== user.id)
    .map((member) =>
      createNotificationService(member.userId, {
        type: NotificationType.group_join,
        title: "New Member Joined",
        message: `${user.name || user.email} joined ${group.name}`,
        relatedGroupId: group.id,
      }).catch((err) => {
        logger.error("Failed to create notification", { userId: member.userId, error: err });
      }),
    );
  await Promise.all(notificationPromises);

  if (updatedGroup) {
    const { emitGroupUpdated } = await import("@/lib/socket-events");
    emitGroupUpdated(group.id, updatedGroup).catch((err) => {
      logger.error("Failed to emit group updated event on join", { error: err });
    });
  }

  logger.info("User joined group", { userId: user.id, groupId: group.id, code: groupCode });

  return updatedGroup!;
}

export async function listGroupsService(token: DecodedIdToken) {
  const user = await getOrCreateUser(token);
  const memberships = await listGroupMembershipsForUser(user.id);
  return memberships.map((m) => m.group);
}

export async function getGroupByIdService(token: DecodedIdToken, groupId: string) {
  const user = await getOrCreateUser(token);

  const membership = await findGroupMembership(groupId, user.id);
  if (!membership) {
    throw new ForbiddenError("User is not a member of this group");
  }

  const group = await findGroupById(groupId);
  if (!group) {
    throw new NotFoundError("Group not found");
  }

  return group;
}

export async function leaveGroupService(token: DecodedIdToken, groupId: string) {
  const user = await getOrCreateUser(token);

  const membership = await findGroupMembership(groupId, user.id);
  if (!membership) {
    throw new ForbiddenError("User is not a member of this group");
  }

  const ownership = await findGroupOwnership(groupId);
  if (!ownership) {
    throw new NotFoundError("Group not found");
  }
  if (ownership.createdById === user.id) {
    throw new ValidationError("Group creator cannot leave the group");
  }

  const allMembers = await listGroupMembersForNotify(groupId);

  await removeGroupMember(groupId, user.id);

  const notificationPromises = allMembers
    .filter((member) => member.userId !== user.id)
    .map((member) =>
      createNotificationService(member.userId, {
        type: NotificationType.group_leave,
        title: "Member Left Group",
        message: `${user.name || user.email} left ${ownership.name}`,
        relatedGroupId: groupId,
      }).catch((err) => {
        logger.error("Failed to create notification", { userId: member.userId, error: err });
      }),
    );
  await Promise.all(notificationPromises);

  const updatedGroup = await findGroupById(groupId);
  if (updatedGroup) {
    const { emitGroupUpdated } = await import("@/lib/socket-events");
    emitGroupUpdated(groupId, updatedGroup).catch((err) => {
      logger.error("Failed to emit group updated event on leave", { error: err });
    });
  }

  logger.info("User left group", { userId: user.id, groupId });
}

export async function deleteGroupService(token: DecodedIdToken, groupId: string) {
  const user = await getOrCreateUser(token);

  const ownership = await findGroupOwnership(groupId);
  if (!ownership) {
    throw new NotFoundError("Group not found");
  }
  if (ownership.createdById !== user.id) {
    throw new ForbiddenError("Only the group creator can delete the group");
  }

  await deleteGroupRow(groupId);

  const { emitGroupDeleted } = await import("@/lib/socket-events");
  emitGroupDeleted(groupId).catch((err) => {
    logger.error("Failed to emit group deleted event", { error: err });
  });

  logger.info("Group deleted", { groupId, deletedBy: user.id });
}

export async function updateGroupService(
  token: DecodedIdToken,
  groupId: string,
  updates: UpdateGroupBody,
) {
  const user = await getOrCreateUser(token);

  const group = await findGroupWithMembership(groupId, user.id);
  if (!group) {
    throw new NotFoundError("Group not found");
  }

  const membership = group.members[0];
  if (!membership) {
    throw new ForbiddenError("User is not a member of this group");
  }

  const isCreator = group.createdById === user.id;
  const isAdmin = membership.role === "admin";
  if (!isCreator && !isAdmin) {
    throw new ForbiddenError("Only group creator or admin can update the group");
  }

  const updatedGroup = await updateGroupRow(groupId, updates);

  const { emitGroupUpdated } = await import("@/lib/socket-events");
  emitGroupUpdated(groupId, updatedGroup).catch((err) => {
    logger.error("Failed to emit group updated event", { error: err });
  });

  logger.info("Group updated", { groupId, updatedBy: user.id, updates });
  return updatedGroup;
}

export async function getGroupByIdForGuestService(groupCode: string, groupId: string) {
  const group = await findGroupById(groupId);
  if (!group) {
    throw new NotFoundError("Group not found");
  }
  if (group.code !== groupCode) {
    throw new ForbiddenError("Invalid group code");
  }

  logger.info("Guest accessed group", { groupId: group.id, code: groupCode });
  return group;
}

export async function validateGroupCodeService(code: string) {
  const group = await findGroupCodeLookup(code);
  if (!group) {
    throw new NotFoundError("Group not found");
  }

  logger.info("Group code validated", { groupId: group.id, code: group.code });
  return group;
}
```

Note: the manual `updates.name.trim().length < 5` check that used to live in `updateGroupService`, and the `if (!updates.name || ...)` check that used to live in `createGroupService`'s caller (`route.ts`), are both gone — `createGroupSchema`/`updateGroupSchema` now enforce the same 5-character minimum at the route boundary before either service is called.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm run test -- src/app/api/groups/services.test.ts`
Expected: PASS — 20 tests passed.

- [ ] **Step 7: Run the full suite and typecheck**

Run: `npm run test && npx tsc --noEmit`
Expected: all tests pass (Task 1's 4 + this task's 20 + everything pre-existing), no type errors.

- [ ] **Step 8: Commit**

```bash
git add src/app/api/groups/repository.ts src/app/api/groups/schemas.ts src/app/api/groups/services.ts src/app/api/groups/services.test.ts
git commit -m "refactor: split groups-core API into repository/service layers with Zod validation"
```

---

### Task 3: Route handlers

**Files:**
- Modify: `src/app/api/groups/route.ts`
- Modify: `src/app/api/groups/join/route.ts`
- Modify: `src/app/api/groups/validate-code/route.ts`
- Modify: `src/app/api/groups/[groupId]/route.ts`
- Modify: `src/app/api/groups/[groupId]/guest/route.ts`
- Modify: `src/app/api/groups/[groupId]/leave/route.ts`

**Interfaces:**
- Consumes: `RouteContext` from `@/lib/auth/with-auth` (Task 1); everything from `./services` and `./schemas` (Task 2); `handleApiError` from `@/lib/handle-api-error`.

- [ ] **Step 1: Rewrite `src/app/api/groups/route.ts`**

```ts
import { withAuth, type AuthContext } from "@/lib/auth/with-auth";
import { handleApiError } from "@/lib/handle-api-error";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { createGroupSchema } from "./schemas";
import { createGroupService, listGroupsService } from "./services";
import { transformGroup } from "./transformers";

async function getHandler(_req: NextRequest, auth: AuthContext) {
  try {
    const groups = await listGroupsService(auth.decodedToken);
    return NextResponse.json({ groups: groups.map(transformGroup) });
  } catch (error) {
    return handleApiError(error);
  }
}

async function postHandler(req: NextRequest, auth: AuthContext) {
  try {
    const body = createGroupSchema.parse(await req.json());
    const group = await createGroupService(auth.decodedToken, body);
    logger.info("Group created via API", { groupId: group.id });
    return NextResponse.json({ group: transformGroup(group) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
```

- [ ] **Step 2: Rewrite `src/app/api/groups/join/route.ts`**

```ts
import { withAuth, type AuthContext } from "@/lib/auth/with-auth";
import { handleApiError } from "@/lib/handle-api-error";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { joinGroupSchema } from "../schemas";
import { joinGroupService } from "../services";
import { transformGroup } from "../transformers";

async function handler(req: NextRequest, auth: AuthContext) {
  try {
    const { groupCode } = joinGroupSchema.parse(await req.json());
    const group = await joinGroupService(auth.decodedToken, groupCode.toUpperCase());
    logger.info("User joined group via API", { userId: auth.uid, groupId: group.id });
    return NextResponse.json({ group: transformGroup(group) }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withAuth(handler);
```

- [ ] **Step 3: Rewrite `src/app/api/groups/validate-code/route.ts`**

```ts
import { handleApiError } from "@/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { validateCodeSchema } from "../schemas";
import { validateGroupCodeService } from "../services";

/**
 * POST /api/groups/validate-code
 * Validates a group code and returns the groupId
 * No authentication required
 */
export async function POST(req: NextRequest) {
  try {
    const { code } = validateCodeSchema.parse(await req.json());
    const group = await validateGroupCodeService(code.toUpperCase());

    return NextResponse.json({
      groupId: group.id,
      groupName: group.name,
      code: group.code,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

- [ ] **Step 4: Rewrite `src/app/api/groups/[groupId]/route.ts`**

```ts
import { withAuth, type AuthContext, type RouteContext } from "@/lib/auth/with-auth";
import { handleApiError } from "@/lib/handle-api-error";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { updateGroupSchema } from "../schemas";
import { deleteGroupService, getGroupByIdService, updateGroupService } from "../services";
import { transformGroup } from "../transformers";

type Params = RouteContext<{ groupId: string }>;

async function getHandler(_req: NextRequest, auth: AuthContext, { params }: Params) {
  try {
    const { groupId } = await params;
    const group = await getGroupByIdService(auth.decodedToken, groupId);
    return NextResponse.json({ group: transformGroup(group) });
  } catch (error) {
    return handleApiError(error);
  }
}

async function patchHandler(req: NextRequest, auth: AuthContext, { params }: Params) {
  try {
    const { groupId } = await params;
    const body = updateGroupSchema.parse(await req.json());
    const group = await updateGroupService(auth.decodedToken, groupId, body);
    logger.info("Group updated via API", { groupId });
    return NextResponse.json({ group: transformGroup(group) });
  } catch (error) {
    return handleApiError(error);
  }
}

async function deleteHandler(_req: NextRequest, auth: AuthContext, { params }: Params) {
  try {
    const { groupId } = await params;
    await deleteGroupService(auth.decodedToken, groupId);
    logger.info("Group deleted via API", { groupId });
    return NextResponse.json({ message: "Group deleted successfully" }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(getHandler);
export const PATCH = withAuth(patchHandler);
export const DELETE = withAuth(deleteHandler);
```

- [ ] **Step 5: Rewrite `src/app/api/groups/[groupId]/guest/route.ts`**

```ts
import {
  withOptionalAuth,
  type OptionalAuthContext,
  type RouteContext,
} from "@/lib/auth/with-auth";
import { handleApiError } from "@/lib/handle-api-error";
import { ForbiddenError } from "@/lib/errors";
import { NextRequest, NextResponse } from "next/server";
import { getGroupByIdForGuestService } from "../../services";
import { transformGroup } from "../../transformers";

type Params = RouteContext<{ groupId: string }>;

/**
 * GET /api/groups/[groupId]/guest
 * Returns group data for guest access (requires X-Guest-Code header)
 */
async function handler(
  _req: NextRequest,
  context: OptionalAuthContext,
  { params }: Params,
) {
  try {
    if (!context.isGuest || !context.groupCode) {
      throw new ForbiddenError("Guest access required");
    }

    const { groupId } = await params;
    const group = await getGroupByIdForGuestService(context.groupCode, groupId);

    return NextResponse.json(transformGroup(group));
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withOptionalAuth(handler);
```

Note: the success response stays as `NextResponse.json(transformGroup(group))` — NOT wrapped in `{ group: ... }` — matching the original response shape exactly, since this differs from every other group endpoint and frontend guest-view code depends on it.

- [ ] **Step 6: Rewrite `src/app/api/groups/[groupId]/leave/route.ts`**

```ts
import { withAuth, type AuthContext, type RouteContext } from "@/lib/auth/with-auth";
import { handleApiError } from "@/lib/handle-api-error";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { leaveGroupService } from "../../services";

type Params = RouteContext<{ groupId: string }>;

async function handler(_req: NextRequest, auth: AuthContext, { params }: Params) {
  try {
    const { groupId } = await params;
    await leaveGroupService(auth.decodedToken, groupId);
    logger.info("User left group via API", { groupId });
    return NextResponse.json({ message: "Successfully left group" }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withAuth(handler);
```

- [ ] **Step 7: Verify types and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/app/api/groups/route.ts src/app/api/groups/join/route.ts src/app/api/groups/validate-code/route.ts "src/app/api/groups/[groupId]/route.ts" "src/app/api/groups/[groupId]/guest/route.ts" "src/app/api/groups/[groupId]/leave/route.ts"
git commit -m "refactor: use context.params and handleApiError in groups-core route handlers"
```

---

### Task 4: Verification and PR

**Files:** None (verification + git operations only).

- [ ] **Step 1: Run the full verification suite**

Run: `npm run lint && npx tsc --noEmit && npm run test`
Expected: all green.

- [ ] **Step 2: Manual verification in the browser, to the extent the environment allows**

Run: `npm run dev`. If a reachable database/Firebase backend is available: create a group, join a group by code, view a group, update a group's name/color/emoji, leave a group (as a non-creator), delete a group (as creator), and load a group via guest code. If no reachable backend is available in this environment (as has been the case for the last two feature migrations), say so explicitly in the report and rely on the test suite plus careful reading instead of claiming verification that didn't happen.

- [ ] **Step 3: Push and open the PR**

```bash
git push -u origin refactor/groups-core-service-repo
gh pr create --base dev --head refactor/groups-core-service-repo \
  --title "refactor: migrate Groups core to service/repository architecture" \
  --body "Migrates group CRUD, join, validate-code, leave, and guest-access routes to the repository/service/route layering from CLAUDE.md, adds Zod validation on every route, and extends withAuth/withOptionalAuth (lib/auth/with-auth.ts) to forward Next's route context so context.params can finally be used instead of manual path parsing — this extension is additive and backward-compatible with all 23 other files using these wrappers. Also deduplicates a 20-line Prisma include block that was repeated 6 times in the original services.ts. One minor behavior normalization: trips are now consistently ordered by createdAt desc in every group-fetching path (3 of 8 service functions previously omitted this ordering). Member Tasks and Groups' nested Trips resource are separate sub-units, not touched here. Part of docs/superpowers/specs/2026-09-22-code-cleanup-design.md, Pass 1."
gh pr checks --watch
```

---

## Definition of Done

- [ ] `lib/auth/with-auth.ts` forwards Next's route context through both `withAuth` and `withOptionalAuth`, verified not to break any of the 23 other files using them.
- [ ] `src/app/api/groups/repository.ts`, `schemas.ts` exist; `services.ts` no longer imports `@/lib/prisma` and no longer duplicates the `include` block six times.
- [ ] All 6 Groups-core routes validate their bodies with Zod, use `context.params` (not manual `pathname` parsing) where applicable, and use `handleApiError`.
- [ ] `services.test.ts` passes and covers all 9 service functions' success and error-throwing paths.
- [ ] Trips ordering is consistently `createdAt desc` everywhere, and this is called out explicitly in the PR description.
- [ ] PR open with the `checks` workflow green.
