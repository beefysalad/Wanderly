# Groups Nested Trips Feature Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the "Groups → nested Trips" sub-unit (`/api/groups/[groupId]/trips` and `/api/groups/[groupId]/trips/[tripId]` — creating, updating, and deleting a trip within a group) to the repository/service/route architecture.

**Architecture:** The original code splits trip create/update/delete across two separate `services.ts` files (`trips/services.ts` for create, `trips/[tripId]/services.ts` for update/delete), each with its own duplicated `{activities, creator}` Prisma include and its own copy of the membership/group-existence checks. This plan consolidates them into ONE `repository.ts`/`services.ts`/`schemas.ts` living at `trips/` (the parent), matching the pattern already established by `groups/repository.ts` serving multiple route files including nested dynamic ones — `trips/[tripId]/route.ts` imports from `../services`/`../schemas`/`../repository` instead of owning its own copy. Membership/ownership/member-listing checks reuse `findGroupMembership`/`findGroupOwnership`/`listGroupMembersForNotify` from the Groups-core repository (`../../repository`), continuing the DRY pattern started in the Member Tasks migration.

**Tech Stack:** Next.js 15 App Router, Prisma, Zod, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-22-code-cleanup-design.md`

**Depends on:** Groups core (`src/app/api/groups/repository.ts`) and Foundation (`lib/errors.ts`, `lib/handle-api-error.ts`, `context.params`-forwarding `withAuth`) — all already merged to `dev`.

**Out of scope:** Top-level `/api/trips` (a different resource entirely, despite the similar name — this plan only touches the nested `/api/groups/[groupId]/trips` resource). No page component owns this sub-feature exclusively (trip creation/update/deletion are triggered from the `Group` and `Trip` pages, which are themselves out of scope for this pass), so there is no component-decomposition task here.

## Global Constraints

- No AI/Claude Code attribution in commit messages or PR descriptions.
- One branch/PR (`refactor/groups-nested-trips-service-repo`), based on `dev`, left fully working at the end.
- `syncUserToDatabaseService`, `createNotificationService`, and the static `emitTripCreated`/`emitTripUpdated`/`emitTripDeleted` imports from `@/lib/socket-events` are external dependencies — call as-is, don't modify or change their import style (they're statically imported here, unlike the dynamic-import style in `groups/services.ts` — preserving that difference is intentional, not a bug to fix).
- Reuse `findGroupMembership`, `findGroupOwnership`, `listGroupMembersForNotify` from `src/app/api/groups/repository.ts` (imported as `../../repository` from `trips/services.ts`) rather than re-duplicating them.
- Preserve the asymmetric permission model exactly: any group member can update a trip; only the trip's creator can delete it. Do not "fix" this inconsistency — it's existing, intentional-as-shipped behavior, unrelated to this migration.
- No behavior change beyond: (a) request bodies validated with Zod before reaching a service (error response shape now matches `handleApiError`'s ZodError branch); (b) unexpected errors return a generic message instead of leaking `error.message`; (c) **a genuine validation tightening, not just a shape change**: the original create-trip code silently fell back to `status: "planning"` if an invalid status string was sent (`validStatuses.includes(status) ? status : "planning"`); the new Zod schema rejects an invalid status with a 400 instead of silently substituting a default. Call this out explicitly in the PR description — it's stricter, not just reshaped. (Update's status validation already rejected invalid values in the original code, so no behavior change there.); (d) `updateTripSchema`'s `name` field now requires at least 1 non-whitespace character — the original `updateTripService` had no length check at all, so a client PATCHing `{name: ""}` previously succeeded and would now 400.

---

### Task 1: Repository, schemas, and services

**Files:**
- Create: `src/app/api/groups/[groupId]/trips/repository.ts`
- Create: `src/app/api/groups/[groupId]/trips/schemas.ts`
- Modify: `src/app/api/groups/[groupId]/trips/services.ts`
- Delete: `src/app/api/groups/[groupId]/trips/[tripId]/services.ts` (its two functions move into the modified `trips/services.ts` above)
- Create: `src/app/api/groups/[groupId]/trips/services.test.ts`

**Interfaces:**
- Consumes: `NotFoundError`, `ForbiddenError` from `@/lib/errors`; `findGroupMembership`, `findGroupOwnership`, `listGroupMembersForNotify` from `../../repository` (Groups core, already on `dev`).
- Produces: `findTripById`, `createTripRow`, `updateTripRow`, `deleteTripRow` from `repository.ts`. `createTripSchema`, `updateTripSchema` from `schemas.ts`. `createTripService`, `updateTripService`, `deleteTripService` from `services.ts` — all three now live in this one file (Task 2's `[tripId]/route.ts` will import `updateTripService`/`deleteTripService` from `../services`, not `./services`).

- [ ] **Step 1: Create the repository**

Create `src/app/api/groups/[groupId]/trips/repository.ts`:

```ts
import prisma from "@/lib/prisma";
import type { Prisma, TripStatus } from "@prisma/client";

const TRIP_DETAIL_INCLUDE = {
  activities: true,
  creator: { select: { id: true, name: true, email: true } },
} satisfies Prisma.TripInclude;

export function findTripById(tripId: string) {
  return prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true, groupId: true, name: true, createdById: true },
  });
}

export interface CreateTripRow {
  groupId: string;
  createdById: string;
  name: string;
  startDate: Date;
  endDate: Date;
  location: string | null;
  status: TripStatus;
}

export function createTripRow(data: CreateTripRow) {
  return prisma.trip.create({ data, include: TRIP_DETAIL_INCLUDE });
}

export interface UpdateTripRow {
  name?: string;
  startDate?: Date;
  endDate?: Date;
  location?: string | null;
  status?: TripStatus;
}

export function updateTripRow(tripId: string, data: UpdateTripRow) {
  return prisma.trip.update({
    where: { id: tripId },
    data,
    include: TRIP_DETAIL_INCLUDE,
  });
}

export function deleteTripRow(tripId: string) {
  return prisma.trip.delete({ where: { id: tripId } });
}
```

(No test file for this one — thin Prisma passthroughs aren't unit tested in this pass.)

- [ ] **Step 2: Create the Zod schemas**

Create `src/app/api/groups/[groupId]/trips/schemas.ts`:

```ts
import { z } from "zod";

const tripStatusSchema = z.enum(["planning", "finalized", "ongoing", "cancelled"]);

export const createTripSchema = z
  .object({
    tripName: z.string().trim().min(1, "Trip name is required"),
    startDate: z.coerce.date({ error: "Invalid date format" }),
    endDate: z.coerce.date({ error: "Invalid date format" }),
    location: z.string().trim().optional(),
    status: tripStatusSchema.optional().default("planning"),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: "Start date must be before end date",
    path: ["endDate"],
  });
export type CreateTripBody = z.infer<typeof createTripSchema>;

export const updateTripSchema = z.object({
  name: z.string().trim().min(1, "Trip name cannot be empty").optional(),
  startDate: z.coerce.date({ error: "Invalid date format" }).optional(),
  endDate: z.coerce.date({ error: "Invalid date format" }).optional(),
  location: z.string().trim().optional(),
  status: tripStatusSchema.optional(),
});
export type UpdateTripBody = z.infer<typeof updateTripSchema>;
```

Note: `z.coerce.date()` already rejects invalid date strings on its own (an unparseable date coerces to an `Invalid Date`, which Zod's date validator rejects) — this replaces the original code's manual `isNaN(start.getTime())` check. The `{ error: "Invalid date format" }` option customizes the failure message and is confirmed working syntax against this repo's installed `zod@4.1.12` (`z.coerce.date({ error: "Invalid date format" }).safeParse("not-a-date")` → `{ success: false, error: { issues: [{ message: "Invalid date format" }] } }`).

- [ ] **Step 3: Write the failing tests for the services**

Create `src/app/api/groups/[groupId]/trips/services.test.ts`:

```ts
import type { DecodedIdToken } from "firebase-admin/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError, NotFoundError } from "@/lib/errors";

const mockFindGroupMembership = vi.fn();
const mockFindGroupOwnership = vi.fn();
const mockListGroupMembersForNotify = vi.fn();
vi.mock("../../repository", () => ({
  findGroupMembership: (...a: unknown[]) => mockFindGroupMembership(...a),
  findGroupOwnership: (...a: unknown[]) => mockFindGroupOwnership(...a),
  listGroupMembersForNotify: (...a: unknown[]) => mockListGroupMembersForNotify(...a),
}));

const mockFindTripById = vi.fn();
const mockCreateTripRow = vi.fn();
const mockUpdateTripRow = vi.fn();
const mockDeleteTripRow = vi.fn();
vi.mock("./repository", () => ({
  findTripById: (...a: unknown[]) => mockFindTripById(...a),
  createTripRow: (...a: unknown[]) => mockCreateTripRow(...a),
  updateTripRow: (...a: unknown[]) => mockUpdateTripRow(...a),
  deleteTripRow: (...a: unknown[]) => mockDeleteTripRow(...a),
}));

const mockSyncUserToDatabaseService = vi.fn();
vi.mock("../../../sync/syncService", () => ({
  syncUserToDatabaseService: (...a: unknown[]) => mockSyncUserToDatabaseService(...a),
}));

const mockCreateNotificationService = vi.fn();
vi.mock("../../../notifications/services", () => ({
  createNotificationService: (...a: unknown[]) => mockCreateNotificationService(...a),
}));

vi.mock("@/lib/socket-events", () => ({
  emitTripCreated: vi.fn().mockResolvedValue(undefined),
  emitTripUpdated: vi.fn().mockResolvedValue(undefined),
  emitTripDeleted: vi.fn().mockResolvedValue(undefined),
}));

const { createTripService, deleteTripService, updateTripService } = await import("./services");

const token = { uid: "firebase-1" } as DecodedIdToken;
const user = { id: "user-1", name: "Alice", email: "alice@example.com" };
const membership = { groupId: "group-1", userId: "user-1" };
const ownership = { createdById: "user-1", name: "Trip Squad" };

beforeEach(() => {
  vi.clearAllMocks();
  mockSyncUserToDatabaseService.mockResolvedValue(user);
  mockCreateNotificationService.mockResolvedValue(undefined);
});

describe("createTripService", () => {
  it("throws ForbiddenError when the user isn't a group member", async () => {
    mockFindGroupMembership.mockResolvedValue(null);

    await expect(
      createTripService(token, "group-1", {
        tripName: "Summer Trip",
        startDate: new Date("2026-06-01"),
        endDate: new Date("2026-06-10"),
        status: "planning",
      }),
    ).rejects.toThrow(ForbiddenError);
    expect(mockCreateTripRow).not.toHaveBeenCalled();
  });

  it("creates the trip and notifies members other than the creator", async () => {
    mockFindGroupMembership.mockResolvedValue(membership);
    mockFindGroupOwnership.mockResolvedValue(ownership);
    mockCreateTripRow.mockResolvedValue({ id: "trip-1", name: "Summer Trip" });
    mockListGroupMembersForNotify.mockResolvedValue([
      { userId: "user-1", user: { id: "user-1", email: "alice@example.com" } },
      { userId: "user-2", user: { id: "user-2", email: "bob@example.com" } },
    ]);

    const startDate = new Date("2026-06-01");
    const endDate = new Date("2026-06-10");
    await createTripService(token, "group-1", {
      tripName: "Summer Trip",
      startDate,
      endDate,
      location: "Osaka",
      status: "planning",
    });

    expect(mockCreateTripRow).toHaveBeenCalledWith({
      groupId: "group-1",
      createdById: "user-1",
      name: "Summer Trip",
      startDate,
      endDate,
      location: "Osaka",
      status: "planning",
    });
    expect(mockCreateNotificationService).toHaveBeenCalledTimes(1);
    expect(mockCreateNotificationService).toHaveBeenCalledWith(
      "user-2",
      expect.objectContaining({ relatedGroupId: "group-1", relatedTripId: "trip-1" }),
    );
  });
});

describe("updateTripService", () => {
  it("throws NotFoundError when the trip doesn't belong to this group", async () => {
    mockFindGroupMembership.mockResolvedValue(membership);
    mockFindGroupOwnership.mockResolvedValue(ownership);
    mockFindTripById.mockResolvedValue({ id: "trip-1", groupId: "other-group" });

    await expect(
      updateTripService(token, "group-1", "trip-1", { status: "ongoing" }),
    ).rejects.toThrow(NotFoundError);
    expect(mockUpdateTripRow).not.toHaveBeenCalled();
  });

  it("allows any group member (not just the creator) to update", async () => {
    mockFindGroupMembership.mockResolvedValue(membership);
    mockFindGroupOwnership.mockResolvedValue(ownership);
    mockFindTripById.mockResolvedValue({
      id: "trip-1",
      groupId: "group-1",
      name: "Summer Trip",
      createdById: "someone-else",
    });
    mockUpdateTripRow.mockResolvedValue({ id: "trip-1", status: "ongoing" });

    await updateTripService(token, "group-1", "trip-1", { status: "ongoing" });

    expect(mockUpdateTripRow).toHaveBeenCalledWith("trip-1", { status: "ongoing" });
  });
});

describe("deleteTripService", () => {
  it("throws ForbiddenError when the user isn't the trip creator", async () => {
    mockFindGroupMembership.mockResolvedValue(membership);
    mockFindGroupOwnership.mockResolvedValue(ownership);
    mockFindTripById.mockResolvedValue({
      id: "trip-1",
      groupId: "group-1",
      name: "Summer Trip",
      createdById: "someone-else",
    });

    await expect(deleteTripService(token, "group-1", "trip-1")).rejects.toThrow(ForbiddenError);
    expect(mockDeleteTripRow).not.toHaveBeenCalled();
  });

  it("notifies remaining members before deleting when the creator deletes", async () => {
    mockFindGroupMembership.mockResolvedValue(membership);
    mockFindGroupOwnership.mockResolvedValue(ownership);
    mockFindTripById.mockResolvedValue({
      id: "trip-1",
      groupId: "group-1",
      name: "Summer Trip",
      createdById: "user-1",
    });
    mockListGroupMembersForNotify.mockResolvedValue([
      { userId: "user-1", user: { id: "user-1", email: "alice@example.com" } },
      { userId: "user-2", user: { id: "user-2", email: "bob@example.com" } },
    ]);

    const callOrder: string[] = [];
    mockCreateNotificationService.mockImplementation(async () => {
      callOrder.push("notify");
    });
    mockDeleteTripRow.mockImplementation(async () => {
      callOrder.push("delete");
    });

    await deleteTripService(token, "group-1", "trip-1");

    expect(mockDeleteTripRow).toHaveBeenCalledWith("trip-1");
    expect(mockCreateNotificationService).toHaveBeenCalledTimes(1);
    expect(callOrder).toEqual(["notify", "delete"]);
  });
});
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `npm run test -- "src/app/api/groups/[groupId]/trips/services.test.ts"`
Expected: FAIL — `services.ts` still calls `prisma` directly and doesn't yet export `updateTripService`/`deleteTripService` (those still live in `[tripId]/services.ts` at this point).

- [ ] **Step 5: Rewrite `services.ts`, absorbing the two functions from `[tripId]/services.ts`**

Replace the full contents of `src/app/api/groups/[groupId]/trips/services.ts`:

```ts
import { logger } from "@/lib/logger";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import type { DecodedIdToken } from "firebase-admin/auth";
import { NotificationType, type TripStatus } from "@prisma/client";
import { syncUserToDatabaseService } from "../../../sync/syncService";
import { createNotificationService } from "../../../notifications/services";
import {
  findGroupMembership,
  findGroupOwnership,
  listGroupMembersForNotify,
} from "../../repository";
import { createTripRow, deleteTripRow, findTripById, updateTripRow } from "./repository";
import { emitTripCreated, emitTripDeleted, emitTripUpdated } from "@/lib/socket-events";
import type { CreateTripBody, UpdateTripBody } from "./schemas";

async function getOrCreateUser(token: DecodedIdToken) {
  return syncUserToDatabaseService(token);
}

async function verifyGroupMembership(token: DecodedIdToken, groupId: string) {
  const user = await getOrCreateUser(token);

  const membership = await findGroupMembership(groupId, user.id);
  if (!membership) {
    throw new ForbiddenError("User is not a member of this group");
  }

  const group = await findGroupOwnership(groupId);
  if (!group) {
    throw new NotFoundError("Group not found");
  }

  return { user, group };
}

async function verifyTripInGroup(groupId: string, tripId: string) {
  const trip = await findTripById(tripId);
  if (!trip) {
    throw new NotFoundError("Trip not found");
  }
  if (trip.groupId !== groupId) {
    throw new NotFoundError("Trip does not belong to this group");
  }
  return trip;
}

export async function createTripService(
  token: DecodedIdToken,
  groupId: string,
  data: CreateTripBody,
) {
  const { user, group } = await verifyGroupMembership(token, groupId);

  const trip = await createTripRow({
    groupId,
    createdById: user.id,
    name: data.tripName,
    startDate: data.startDate,
    endDate: data.endDate,
    location: data.location || null,
    status: data.status as TripStatus,
  });

  const allMembers = await listGroupMembersForNotify(groupId);
  const notificationPromises = allMembers
    .filter((member) => member.userId !== user.id)
    .map((member) =>
      createNotificationService(member.userId, {
        type: NotificationType.trip_created,
        title: "New Trip Created",
        message: `${user.name || user.email} created trip '${data.tripName}' in ${group.name}`,
        relatedGroupId: groupId,
        relatedTripId: trip.id,
      }).catch((err) => {
        logger.error("Failed to create notification", { userId: member.userId, error: err });
      }),
    );
  await Promise.all(notificationPromises);

  emitTripCreated(groupId, trip).catch((err) => {
    logger.error("Failed to emit trip created event", { error: err });
  });

  logger.info("Trip created", { tripId: trip.id, groupId });
  return trip;
}

export async function updateTripService(
  token: DecodedIdToken,
  groupId: string,
  tripId: string,
  updates: UpdateTripBody,
) {
  await verifyGroupMembership(token, groupId);
  await verifyTripInGroup(groupId, tripId);

  const trip = await updateTripRow(tripId, {
    ...(updates.name !== undefined && { name: updates.name }),
    ...(updates.startDate !== undefined && { startDate: updates.startDate }),
    ...(updates.endDate !== undefined && { endDate: updates.endDate }),
    ...(updates.location !== undefined && { location: updates.location || null }),
    ...(updates.status !== undefined && { status: updates.status as TripStatus }),
  });

  emitTripUpdated(groupId, trip).catch((err) => {
    logger.error("Failed to emit trip updated event", { error: err });
  });

  logger.info("Trip updated", { tripId, groupId });
  return trip;
}

export async function deleteTripService(
  token: DecodedIdToken,
  groupId: string,
  tripId: string,
) {
  const { user, group } = await verifyGroupMembership(token, groupId);
  const trip = await verifyTripInGroup(groupId, tripId);

  if (trip.createdById !== user.id) {
    throw new ForbiddenError("Only the trip creator can delete this trip");
  }

  const allMembers = await listGroupMembersForNotify(groupId);

  // Notify remaining members BEFORE deletion, per the original code's ordering.
  const notificationPromises = allMembers
    .filter((member) => member.userId !== user.id)
    .map((member) =>
      createNotificationService(member.userId, {
        type: NotificationType.trip_deleted,
        title: "Trip Deleted",
        message: `${user.name || user.email} deleted trip '${trip.name}' from ${group.name}`,
        relatedGroupId: groupId,
      }).catch((err) => {
        logger.error("Failed to create notification", { userId: member.userId, error: err });
      }),
    );
  await Promise.all(notificationPromises);

  await deleteTripRow(tripId);

  emitTripDeleted(groupId, tripId, {
    deletedBy: user.name || user.email,
    tripName: trip.name,
  }).catch((err) => {
    logger.error("Failed to emit trip deleted event", { error: err });
  });

  logger.info("Trip deleted", { tripId, groupId });
}
```

- [ ] **Step 6: Delete `[tripId]/services.ts`**

```bash
git rm "src/app/api/groups/[groupId]/trips/[tripId]/services.ts"
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npm run test -- "src/app/api/groups/[groupId]/trips/services.test.ts"`
Expected: PASS — 5 tests passed.

- [ ] **Step 8: Run the full suite**

Run: `npm run test`
Expected: all tests pass, no regressions.

Run: `npx tsc --noEmit`
Expected: this may show 0 or more errors confined to `trips/route.ts` and `trips/[tripId]/route.ts` (Task 2's files — they still import from the old locations/signatures at this point). If any error is anywhere else, stop and report it; that would be a real problem with this task's own code.

- [ ] **Step 9: Commit**

```bash
git add "src/app/api/groups/[groupId]/trips/repository.ts" "src/app/api/groups/[groupId]/trips/schemas.ts" "src/app/api/groups/[groupId]/trips/services.ts" "src/app/api/groups/[groupId]/trips/services.test.ts"
git commit -m "refactor: consolidate group-trip API into repository/service layers, reuse Groups-core repository for membership checks"
```

(The `git rm` from Step 6 is already staged and will be included in this commit.)

---

### Task 2: Route handlers

**Files:**
- Modify: `src/app/api/groups/[groupId]/trips/route.ts`
- Modify: `src/app/api/groups/[groupId]/trips/[tripId]/route.ts`

**Interfaces:**
- Consumes: `RouteContext` from `@/lib/auth/with-auth`; `createTripService`/`updateTripService`/`deleteTripService` and `createTripSchema`/`updateTripSchema` — all now in the parent `trips/` directory (Task 1).

- [ ] **Step 1: Rewrite `src/app/api/groups/[groupId]/trips/route.ts`**

```ts
import { withAuth, type AuthContext, type RouteContext } from "@/lib/auth/with-auth";
import { handleApiError } from "@/lib/handle-api-error";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { createTripSchema } from "./schemas";
import { createTripService } from "./services";
import { transformTrip } from "../../transformers";

type Params = RouteContext<{ groupId: string }>;

async function postHandler(req: NextRequest, auth: AuthContext, { params }: Params) {
  try {
    const { groupId } = await params;
    const body = createTripSchema.parse(await req.json());
    const trip = await createTripService(auth.decodedToken, groupId, body);
    logger.info("Trip created via API", { tripId: trip.id, groupId });
    return NextResponse.json({ trip: transformTrip(trip) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withAuth(postHandler);
```

- [ ] **Step 2: Rewrite `src/app/api/groups/[groupId]/trips/[tripId]/route.ts`**

```ts
import { withAuth, type AuthContext, type RouteContext } from "@/lib/auth/with-auth";
import { handleApiError } from "@/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { updateTripSchema } from "../schemas";
import { deleteTripService, updateTripService } from "../services";
import { transformTrip } from "../../../transformers";

type Params = RouteContext<{ groupId: string; tripId: string }>;

async function patchHandler(req: NextRequest, auth: AuthContext, { params }: Params) {
  try {
    const { groupId, tripId } = await params;
    const body = updateTripSchema.parse(await req.json());
    const trip = await updateTripService(auth.decodedToken, groupId, tripId, body);
    return NextResponse.json({ trip: transformTrip(trip) });
  } catch (error) {
    return handleApiError(error);
  }
}

async function deleteHandler(_req: NextRequest, auth: AuthContext, { params }: Params) {
  try {
    const { groupId, tripId } = await params;
    await deleteTripService(auth.decodedToken, groupId, tripId);
    return NextResponse.json({ message: "Trip deleted successfully" }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export const PATCH = withAuth(patchHandler);
export const DELETE = withAuth(deleteHandler);
```

- [ ] **Step 3: Verify types and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors (this resolves any transient error from Task 1's Step 8).

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/groups/[groupId]/trips/route.ts" "src/app/api/groups/[groupId]/trips/[tripId]/route.ts"
git commit -m "refactor: use context.params and handleApiError in group-trip route handlers"
```

---

### Task 3: Verification and PR

**Files:** None (verification + git operations only).

- [ ] **Step 1: Run the full verification suite**

Run: `npm run lint && npx tsc --noEmit && npm run test`
Expected: all green.

- [ ] **Step 2: Manual verification in the browser, to the extent the environment allows**

Run: `npm run dev`. If a reachable database/Firebase backend is available: create a trip in a group, update its status from the Trip page, delete a trip as its creator, and confirm a non-creator member gets a 403 attempting to delete. If no reachable backend is available (as has been the case for every prior migration in this series), say so explicitly and rely on the test suite plus careful reading instead of claiming verification that didn't happen.

- [ ] **Step 3: Push and open the PR**

```bash
git push -u origin refactor/groups-nested-trips-service-repo
gh pr create --base dev --head refactor/groups-nested-trips-service-repo \
  --title "refactor: migrate Groups nested Trips to service/repository architecture" \
  --body "Migrates /api/groups/[groupId]/trips(/[tripId]) to the repository/service/route layering from CLAUDE.md. Consolidates two previously-separate services.ts files (create in one, update/delete in another, each with its own duplicated Prisma include and membership checks) into one repository.ts/services.ts/schemas.ts, matching the pattern groups/repository.ts already uses to serve multiple route files. Reuses Groups-core's findGroupMembership/findGroupOwnership/listGroupMembersForNotify instead of re-duplicating them. Adds Zod validation, including a genuine tightening: create-trip now rejects an invalid status instead of silently falling back to 'planning'. Preserves the existing asymmetric permission model (any member can update a trip, only the creator can delete it) unchanged. Part of docs/superpowers/specs/2026-09-22-code-cleanup-design.md, Pass 1 — completes the Groups feature (core + Member Tasks + nested Trips, all three sub-units now done)."
gh pr checks --watch
```

---

## Definition of Done

- [ ] `src/app/api/groups/[groupId]/trips/repository.ts`, `schemas.ts` exist; `services.ts` contains all three service functions (create/update/delete) and no longer imports `@/lib/prisma`; `[tripId]/services.ts` is deleted.
- [ ] `services.ts` reuses `findGroupMembership`/`findGroupOwnership`/`listGroupMembersForNotify` from `../../repository` instead of duplicating them.
- [ ] Both routes validate their bodies with Zod, use `context.params`, and use `handleApiError`.
- [ ] `services.test.ts` passes and covers all 3 service functions' success and error-throwing paths, including the asymmetric update-vs-delete permission behavior.
- [ ] PR open with the `checks` workflow green, and the PR description calls out the status-validation tightening (create) and the name-length tightening (update).
