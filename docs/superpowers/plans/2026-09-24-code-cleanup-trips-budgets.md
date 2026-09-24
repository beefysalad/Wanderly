# Trips → Budgets Feature Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `/api/trips/[tripId]/budgets` and `/api/trips/[tripId]/budgets/[budgetId]` to the repository/service/route architecture, and introduce ONE shared trip-access helper that the remaining trip-scoped features (Activities, Expenses, Expense Payments, Payment-logs, ICS export) will adopt.

**Architecture:** Every trip-scoped service currently re-implements the same `verifyTripAccess` (look up the trip, then check the caller is a member of its group) — 6 files, 7 copies. Task 1 adds it once at `src/app/api/trips/access.ts` (backed by `src/app/api/trips/repository.ts` and the Groups-core `findGroupMembership`). Tasks 2–3 migrate Budgets onto it. Budgets has no page-component work: the Budget UI is already split into files under 300 lines.

**Tech Stack:** Next.js 15 App Router, Prisma, Zod, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-22-code-cleanup-design.md`

**Depends on:** Foundation, Groups core (`src/app/api/groups/repository.ts` → `findGroupMembership`) — merged to `dev`.

**Out of scope:** the other five trip-scoped features (they keep their own private `verifyTripAccess` until their own migrations); guest access to budgets (deliberately unimplemented today — preserve that).

## Global Constraints

- No AI/Claude Code attribution in commit messages or PR descriptions.
- One branch/PR (`refactor/trips-budgets-service-repo`), based on `dev`, left fully working at the end.
- `syncUserToDatabaseService` is an external dependency — call as-is.
- Budgets routes keep `withOptionalAuth` and keep rejecting guests with a 403 and the SAME messages as today (GET: "Guest access not yet implemented for budgets"; POST: "Guest access not allowed for creating budgets"; PUT: "...updating budgets"; DELETE: "...deleting budgets"). Do not switch them to `withAuth` — that would turn a guest's 403 into a 401.
- Keep the HTTP verbs as they are: update is `PUT` (not PATCH); delete returns `{ success: true }`.
- No behavior change beyond: (a) request bodies validated with Zod (error shape now `handleApiError`'s); (b) unexpected errors return a generic message instead of leaking `error.message`; (c) status codes now reflect the failure instead of a blanket 500: trip missing → 404, non-member → 403, budget missing → 404, activity not in this trip → 400; (d) `amount` must be a positive finite number (previously unchecked on the server; the form already requires it); (e) **bug fix**: on update, an empty-string `activityId` (which the budget form sends when no activity is selected) is now stored as `null` — previously it was passed to Prisma as `""`, which violates the foreign key. Call (e) out explicitly in the PR description.

---

### Task 1: Shared trip-access helper

**Files:**
- Create: `src/app/api/trips/repository.ts`
- Create: `src/app/api/trips/access.ts`
- Create: `src/app/api/trips/access.test.ts`

**Interfaces:**
- Consumes: `NotFoundError`, `ForbiddenError` from `@/lib/errors`; `findGroupMembership` from `../groups/repository`; `syncUserToDatabaseService` from `../sync/syncService`.
- Produces: `findTripAccessInfo(tripId)` from `repository.ts`; `verifyTripAccess(token, tripId): Promise<{ trip: { id: string; groupId: string }; user: User }>` from `access.ts`. Later trip-scoped migrations import `verifyTripAccess` from `../../access` (or the appropriate relative path).

- [ ] **Step 1: Create the repository**

Create `src/app/api/trips/repository.ts`:

```ts
import prisma from "@/lib/prisma";

export function findTripAccessInfo(tripId: string) {
  return prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true, groupId: true },
  });
}
```

- [ ] **Step 2: Write the failing tests**

Create `src/app/api/trips/access.test.ts`:

```ts
import type { DecodedIdToken } from "firebase-admin/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError, NotFoundError } from "@/lib/errors";

const mockFindTripAccessInfo = vi.fn();
vi.mock("./repository", () => ({
  findTripAccessInfo: (...a: unknown[]) => mockFindTripAccessInfo(...a),
}));

const mockFindGroupMembership = vi.fn();
vi.mock("../groups/repository", () => ({
  findGroupMembership: (...a: unknown[]) => mockFindGroupMembership(...a),
}));

const mockSyncUserToDatabaseService = vi.fn();
vi.mock("../sync/syncService", () => ({
  syncUserToDatabaseService: (...a: unknown[]) => mockSyncUserToDatabaseService(...a),
}));

const { verifyTripAccess } = await import("./access");

const token = { uid: "firebase-1" } as DecodedIdToken;
const user = { id: "user-1", name: "Alice", email: "alice@example.com" };

beforeEach(() => {
  vi.clearAllMocks();
  mockSyncUserToDatabaseService.mockResolvedValue(user);
});

describe("verifyTripAccess", () => {
  it("throws NotFoundError when the trip doesn't exist, without checking membership", async () => {
    mockFindTripAccessInfo.mockResolvedValue(null);

    await expect(verifyTripAccess(token, "trip-1")).rejects.toThrow(NotFoundError);
    expect(mockFindGroupMembership).not.toHaveBeenCalled();
  });

  it("throws ForbiddenError when the user isn't a member of the trip's group", async () => {
    mockFindTripAccessInfo.mockResolvedValue({ id: "trip-1", groupId: "group-1" });
    mockFindGroupMembership.mockResolvedValue(null);

    await expect(verifyTripAccess(token, "trip-1")).rejects.toThrow(ForbiddenError);
    expect(mockFindGroupMembership).toHaveBeenCalledWith("group-1", "user-1");
  });

  it("returns the trip and user when the caller is a member", async () => {
    mockFindTripAccessInfo.mockResolvedValue({ id: "trip-1", groupId: "group-1" });
    mockFindGroupMembership.mockResolvedValue({ groupId: "group-1", userId: "user-1" });

    const result = await verifyTripAccess(token, "trip-1");

    expect(result).toEqual({ trip: { id: "trip-1", groupId: "group-1" }, user });
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm run test -- src/app/api/trips/access.test.ts`
Expected: FAIL — `Cannot find module './access'`.

- [ ] **Step 4: Implement the helper**

Create `src/app/api/trips/access.ts`:

```ts
import type { DecodedIdToken } from "firebase-admin/auth";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { findGroupMembership } from "../groups/repository";
import { syncUserToDatabaseService } from "../sync/syncService";
import { findTripAccessInfo } from "./repository";

export async function verifyTripAccess(token: DecodedIdToken, tripId: string) {
  const user = await syncUserToDatabaseService(token);

  const trip = await findTripAccessInfo(tripId);
  if (!trip) {
    throw new NotFoundError("Trip not found");
  }

  const membership = await findGroupMembership(trip.groupId, user.id);
  if (!membership) {
    throw new ForbiddenError("User does not have access to this trip");
  }

  return { trip, user };
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run test -- src/app/api/trips/access.test.ts`
Expected: PASS — 3 tests.

- [ ] **Step 6: Full suite and typecheck**

Run: `npm run test && npx tsc --noEmit`
Expected: all pass, 0 type errors (nothing else imports these files yet).

- [ ] **Step 7: Commit**

```bash
git add src/app/api/trips/repository.ts src/app/api/trips/access.ts src/app/api/trips/access.test.ts
git commit -m "feat: add shared verifyTripAccess helper for trip-scoped API features"
```

---

### Task 2: Budgets repository, schemas, and services

**Files:**
- Create: `src/app/api/trips/[tripId]/budgets/repository.ts`
- Create: `src/app/api/trips/[tripId]/budgets/schemas.ts`
- Create: `src/app/api/trips/[tripId]/budgets/schemas.test.ts`
- Modify: `src/app/api/trips/[tripId]/budgets/services.ts`
- Create: `src/app/api/trips/[tripId]/budgets/services.test.ts`

**Interfaces:**
- Consumes: `verifyTripAccess` from `../../access`; `NotFoundError`, `ValidationError` from `@/lib/errors`.
- Produces: `listBudgetsByTrip`, `findBudgetById`, `findActivityTripId`, `createBudgetRow`, `updateBudgetRow`, `deleteBudgetRow` from `repository.ts`; `createBudgetSchema`, `updateBudgetSchema` from `schemas.ts`; the four service functions keep their current names and `(token, tripId[, budgetId][, data])` argument order, but create/update now take the parsed schema types.

- [ ] **Step 1: Create the repository**

Create `src/app/api/trips/[tripId]/budgets/repository.ts`:

```ts
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const BUDGET_INCLUDE = {
  activity: { select: { id: true, title: true, date: true } },
} satisfies Prisma.BudgetInclude;

export function listBudgetsByTrip(tripId: string) {
  return prisma.budget.findMany({
    where: { tripId },
    include: BUDGET_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

export function findBudgetById(budgetId: string) {
  return prisma.budget.findUnique({ where: { id: budgetId } });
}

export function findActivityTripId(activityId: string) {
  return prisma.activity.findUnique({
    where: { id: activityId },
    select: { tripId: true },
  });
}

export interface CreateBudgetRow {
  tripId: string;
  amount: number;
  description: string | null;
  category: string | null;
  activityId: string | null;
  isBooked: boolean;
}

export function createBudgetRow(data: CreateBudgetRow) {
  return prisma.budget.create({
    data: { ...data, amount: new Decimal(data.amount) },
    include: BUDGET_INCLUDE,
  });
}

export interface UpdateBudgetRow {
  amount?: number;
  description?: string | null;
  category?: string | null;
  activityId?: string | null;
  isBooked?: boolean;
}

export function updateBudgetRow(budgetId: string, data: UpdateBudgetRow) {
  return prisma.budget.update({
    where: { id: budgetId },
    data: {
      ...data,
      amount: data.amount !== undefined ? new Decimal(data.amount) : undefined,
    },
    include: BUDGET_INCLUDE,
  });
}

export function deleteBudgetRow(budgetId: string) {
  return prisma.budget.delete({ where: { id: budgetId } });
}
```

(No test file — thin Prisma passthroughs aren't unit tested in this pass. `findActivityTripId` lives here for now; when Activities is migrated, fold it into that feature's repository.)

- [ ] **Step 2: Write the failing schema tests**

Create `src/app/api/trips/[tripId]/budgets/schemas.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createBudgetSchema, updateBudgetSchema } from "./schemas";

describe("createBudgetSchema", () => {
  it("accepts the exact payload the budget form sends (empty-string activityId and category)", () => {
    const result = createBudgetSchema.safeParse({
      amount: 120.5,
      description: "Flights",
      category: "",
      activityId: "",
      isBooked: false,
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.amount).toBe(120.5);
  });

  it("coerces a numeric string amount", () => {
    const result = createBudgetSchema.safeParse({ amount: "12.5" });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.amount).toBe(12.5);
  });

  it("rejects a missing amount", () => {
    expect(createBudgetSchema.safeParse({ description: "x" }).success).toBe(false);
  });

  it("rejects zero, negative, null, and non-numeric amounts", () => {
    for (const amount of [0, -5, null, "abc"]) {
      expect(createBudgetSchema.safeParse({ amount }).success).toBe(false);
    }
  });
});

describe("updateBudgetSchema", () => {
  it("accepts a partial update", () => {
    const result = updateBudgetSchema.safeParse({ isBooked: true });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.isBooked).toBe(true);
  });

  it("accepts null and empty-string activityId so a budget can be unlinked", () => {
    expect(updateBudgetSchema.safeParse({ activityId: null }).success).toBe(true);
    expect(updateBudgetSchema.safeParse({ activityId: "" }).success).toBe(true);
  });

  it("rejects a non-positive amount when one is provided", () => {
    expect(updateBudgetSchema.safeParse({ amount: 0 }).success).toBe(false);
  });
});
```

- [ ] **Step 3: Run the schema tests to verify they fail**

Run: `npm run test -- "src/app/api/trips/[tripId]/budgets/schemas.test.ts"`
Expected: FAIL — `Cannot find module './schemas'`.

- [ ] **Step 4: Create the schemas**

Create `src/app/api/trips/[tripId]/budgets/schemas.ts`:

```ts
import { z } from "zod";

// coerce so "12.5" works, but null/""/0 all become 0 and fail `positive`.
const amountSchema = z.coerce
  .number({ error: "Amount must be a number" })
  .finite()
  .positive("Amount must be a positive number");

export const createBudgetSchema = z.object({
  amount: amountSchema,
  description: z.string().nullish(),
  category: z.string().nullish(),
  activityId: z.string().nullish(),
  isBooked: z.boolean().optional(),
});
export type CreateBudgetBody = z.infer<typeof createBudgetSchema>;

export const updateBudgetSchema = z.object({
  amount: amountSchema.optional(),
  description: z.string().nullish(),
  category: z.string().nullish(),
  activityId: z.string().nullish(),
  isBooked: z.boolean().optional(),
});
export type UpdateBudgetBody = z.infer<typeof updateBudgetSchema>;
```

- [ ] **Step 5: Run the schema tests to verify they pass**

Run: `npm run test -- "src/app/api/trips/[tripId]/budgets/schemas.test.ts"`
Expected: PASS — 7 tests.

- [ ] **Step 6: Write the failing service tests**

Create `src/app/api/trips/[tripId]/budgets/services.test.ts`:

```ts
import type { DecodedIdToken } from "firebase-admin/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError, ValidationError } from "@/lib/errors";

const mockVerifyTripAccess = vi.fn();
vi.mock("../../access", () => ({
  verifyTripAccess: (...a: unknown[]) => mockVerifyTripAccess(...a),
}));

const mockListBudgetsByTrip = vi.fn();
const mockFindBudgetById = vi.fn();
const mockFindActivityTripId = vi.fn();
const mockCreateBudgetRow = vi.fn();
const mockUpdateBudgetRow = vi.fn();
const mockDeleteBudgetRow = vi.fn();
vi.mock("./repository", () => ({
  listBudgetsByTrip: (...a: unknown[]) => mockListBudgetsByTrip(...a),
  findBudgetById: (...a: unknown[]) => mockFindBudgetById(...a),
  findActivityTripId: (...a: unknown[]) => mockFindActivityTripId(...a),
  createBudgetRow: (...a: unknown[]) => mockCreateBudgetRow(...a),
  updateBudgetRow: (...a: unknown[]) => mockUpdateBudgetRow(...a),
  deleteBudgetRow: (...a: unknown[]) => mockDeleteBudgetRow(...a),
}));

const {
  createBudgetService,
  deleteBudgetService,
  listBudgetsService,
  updateBudgetService,
} = await import("./services");

const token = { uid: "firebase-1" } as DecodedIdToken;

beforeEach(() => {
  vi.clearAllMocks();
  mockVerifyTripAccess.mockResolvedValue({ trip: { id: "trip-1", groupId: "group-1" }, user: { id: "user-1" } });
});

describe("listBudgetsService", () => {
  it("checks trip access, then returns the trip's budgets", async () => {
    mockListBudgetsByTrip.mockResolvedValue([{ id: "b1" }]);

    const result = await listBudgetsService(token, "trip-1");

    expect(mockVerifyTripAccess).toHaveBeenCalledWith(token, "trip-1");
    expect(mockListBudgetsByTrip).toHaveBeenCalledWith("trip-1");
    expect(result).toEqual([{ id: "b1" }]);
  });
});

describe("createBudgetService", () => {
  it("throws ValidationError when the activity belongs to a different trip", async () => {
    mockFindActivityTripId.mockResolvedValue({ tripId: "other-trip" });

    await expect(
      createBudgetService(token, "trip-1", { amount: 10, activityId: "act-1" }),
    ).rejects.toThrow(ValidationError);
    expect(mockCreateBudgetRow).not.toHaveBeenCalled();
  });

  it("applies defaults and turns an empty-string activityId into null without an activity lookup", async () => {
    mockCreateBudgetRow.mockResolvedValue({ id: "b1" });

    await createBudgetService(token, "trip-1", { amount: 10, category: "", activityId: "" });

    expect(mockFindActivityTripId).not.toHaveBeenCalled();
    expect(mockCreateBudgetRow).toHaveBeenCalledWith({
      tripId: "trip-1",
      amount: 10,
      description: null,
      category: null,
      activityId: null,
      isBooked: false,
    });
  });

  it("links a valid activity from the same trip", async () => {
    mockFindActivityTripId.mockResolvedValue({ tripId: "trip-1" });
    mockCreateBudgetRow.mockResolvedValue({ id: "b1" });

    await createBudgetService(token, "trip-1", {
      amount: 25,
      description: "Museum",
      activityId: "act-1",
      isBooked: true,
    });

    expect(mockCreateBudgetRow).toHaveBeenCalledWith({
      tripId: "trip-1",
      amount: 25,
      description: "Museum",
      category: null,
      activityId: "act-1",
      isBooked: true,
    });
  });
});

describe("updateBudgetService", () => {
  it("throws NotFoundError when the budget belongs to a different trip", async () => {
    mockFindBudgetById.mockResolvedValue({ id: "b1", tripId: "other-trip" });

    await expect(updateBudgetService(token, "trip-1", "b1", { isBooked: true })).rejects.toThrow(
      NotFoundError,
    );
    expect(mockUpdateBudgetRow).not.toHaveBeenCalled();
  });

  it("throws ValidationError when relinking to an activity from another trip", async () => {
    mockFindBudgetById.mockResolvedValue({ id: "b1", tripId: "trip-1" });
    mockFindActivityTripId.mockResolvedValue({ tripId: "other-trip" });

    await expect(
      updateBudgetService(token, "trip-1", "b1", { activityId: "act-9" }),
    ).rejects.toThrow(ValidationError);
    expect(mockUpdateBudgetRow).not.toHaveBeenCalled();
  });

  it("stores an empty-string activityId as null (unlink) instead of passing '' to the database", async () => {
    mockFindBudgetById.mockResolvedValue({ id: "b1", tripId: "trip-1" });
    mockUpdateBudgetRow.mockResolvedValue({ id: "b1" });

    await updateBudgetService(token, "trip-1", "b1", { activityId: "" });

    expect(mockFindActivityTripId).not.toHaveBeenCalled();
    expect(mockUpdateBudgetRow).toHaveBeenCalledWith("b1", { activityId: null });
  });

  it("passes only the fields that were provided", async () => {
    mockFindBudgetById.mockResolvedValue({ id: "b1", tripId: "trip-1" });
    mockUpdateBudgetRow.mockResolvedValue({ id: "b1" });

    await updateBudgetService(token, "trip-1", "b1", { amount: 99, isBooked: true });

    expect(mockUpdateBudgetRow).toHaveBeenCalledWith("b1", { amount: 99, isBooked: true });
  });
});

describe("deleteBudgetService", () => {
  it("throws NotFoundError when the budget doesn't exist", async () => {
    mockFindBudgetById.mockResolvedValue(null);

    await expect(deleteBudgetService(token, "trip-1", "b1")).rejects.toThrow(NotFoundError);
    expect(mockDeleteBudgetRow).not.toHaveBeenCalled();
  });

  it("deletes a budget that belongs to the trip", async () => {
    mockFindBudgetById.mockResolvedValue({ id: "b1", tripId: "trip-1" });

    await deleteBudgetService(token, "trip-1", "b1");

    expect(mockDeleteBudgetRow).toHaveBeenCalledWith("b1");
  });
});
```

- [ ] **Step 7: Run the service tests to verify they fail**

Run: `npm run test -- "src/app/api/trips/[tripId]/budgets/services.test.ts"`
Expected: FAIL — the current `services.ts` calls `prisma` directly and has its own private `verifyTripAccess`, so none of the mocked functions are called.

- [ ] **Step 8: Rewrite the services**

Replace the full contents of `src/app/api/trips/[tripId]/budgets/services.ts`:

```ts
import type { DecodedIdToken } from "firebase-admin/auth";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { verifyTripAccess } from "../../access";
import {
  createBudgetRow,
  deleteBudgetRow,
  findActivityTripId,
  findBudgetById,
  listBudgetsByTrip,
  updateBudgetRow,
} from "./repository";
import type { CreateBudgetBody, UpdateBudgetBody } from "./schemas";

async function assertActivityInTrip(activityId: string, tripId: string) {
  const activity = await findActivityTripId(activityId);
  if (!activity || activity.tripId !== tripId) {
    throw new ValidationError("Activity not found or does not belong to this trip");
  }
}

async function assertBudgetInTrip(budgetId: string, tripId: string) {
  const budget = await findBudgetById(budgetId);
  if (!budget || budget.tripId !== tripId) {
    throw new NotFoundError("Budget item not found");
  }
}

export async function listBudgetsService(token: DecodedIdToken, tripId: string) {
  await verifyTripAccess(token, tripId);
  return listBudgetsByTrip(tripId);
}

export async function createBudgetService(
  token: DecodedIdToken,
  tripId: string,
  data: CreateBudgetBody,
) {
  await verifyTripAccess(token, tripId);

  if (data.activityId) {
    await assertActivityInTrip(data.activityId, tripId);
  }

  return createBudgetRow({
    tripId,
    amount: data.amount,
    description: data.description || null,
    category: data.category || null,
    activityId: data.activityId || null,
    isBooked: data.isBooked ?? false,
  });
}

export async function updateBudgetService(
  token: DecodedIdToken,
  tripId: string,
  budgetId: string,
  updates: UpdateBudgetBody,
) {
  await verifyTripAccess(token, tripId);
  await assertBudgetInTrip(budgetId, tripId);

  if (updates.activityId) {
    await assertActivityInTrip(updates.activityId, tripId);
  }

  return updateBudgetRow(budgetId, {
    ...(updates.amount !== undefined && { amount: updates.amount }),
    ...(updates.description !== undefined && { description: updates.description }),
    ...(updates.category !== undefined && { category: updates.category }),
    ...(updates.activityId !== undefined && { activityId: updates.activityId || null }),
    ...(updates.isBooked !== undefined && { isBooked: updates.isBooked }),
  });
}

export async function deleteBudgetService(
  token: DecodedIdToken,
  tripId: string,
  budgetId: string,
) {
  await verifyTripAccess(token, tripId);
  await assertBudgetInTrip(budgetId, tripId);
  await deleteBudgetRow(budgetId);
}
```

- [ ] **Step 9: Run the service tests to verify they pass**

Run: `npm run test -- "src/app/api/trips/[tripId]/budgets"`
Expected: PASS — 7 schema tests + 10 service tests.

- [ ] **Step 10: Full suite and typecheck**

Run: `npm run test`
Expected: all pass, no regressions.

Run: `npx tsc --noEmit`
Expected: 0 errors, or errors confined to the two budgets route files (Task 3's files; they still call the old service signatures). Any error elsewhere is a problem with this task — stop and report it.

- [ ] **Step 11: Commit**

```bash
git add "src/app/api/trips/[tripId]/budgets/repository.ts" "src/app/api/trips/[tripId]/budgets/schemas.ts" "src/app/api/trips/[tripId]/budgets/schemas.test.ts" "src/app/api/trips/[tripId]/budgets/services.ts" "src/app/api/trips/[tripId]/budgets/services.test.ts"
git commit -m "refactor: split budgets API into repository/service layers on the shared trip-access helper"
```

---

### Task 3: Route handlers

**Files:**
- Modify: `src/app/api/trips/[tripId]/budgets/route.ts`
- Modify: `src/app/api/trips/[tripId]/budgets/[budgetId]/route.ts`

**Interfaces:**
- Consumes: `withOptionalAuth`, `OptionalAuthContext`, `RouteContext` from `@/lib/auth/with-auth`; `ForbiddenError` from `@/lib/errors`; services and schemas from Task 2.

- [ ] **Step 1: Rewrite `budgets/route.ts`**

```ts
import {
  withOptionalAuth,
  type OptionalAuthContext,
  type RouteContext,
} from "@/lib/auth/with-auth";
import { ForbiddenError } from "@/lib/errors";
import { handleApiError } from "@/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { createBudgetSchema } from "./schemas";
import { createBudgetService, listBudgetsService } from "./services";

type Params = RouteContext<{ tripId: string }>;

async function getHandler(_req: NextRequest, context: OptionalAuthContext, { params }: Params) {
  try {
    if (context.isGuest) {
      throw new ForbiddenError("Guest access not yet implemented for budgets");
    }
    const { tripId } = await params;
    const budgets = await listBudgetsService(context.decodedToken, tripId);
    return NextResponse.json({ budgets });
  } catch (error) {
    return handleApiError(error);
  }
}

async function postHandler(req: NextRequest, context: OptionalAuthContext, { params }: Params) {
  try {
    if (context.isGuest) {
      throw new ForbiddenError("Guest access not allowed for creating budgets");
    }
    const { tripId } = await params;
    const body = createBudgetSchema.parse(await req.json());
    const budget = await createBudgetService(context.decodedToken, tripId, body);
    return NextResponse.json({ budget }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withOptionalAuth(getHandler);
export const POST = withOptionalAuth(postHandler);
```

- [ ] **Step 2: Rewrite `budgets/[budgetId]/route.ts`**

```ts
import {
  withOptionalAuth,
  type OptionalAuthContext,
  type RouteContext,
} from "@/lib/auth/with-auth";
import { ForbiddenError } from "@/lib/errors";
import { handleApiError } from "@/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { updateBudgetSchema } from "../schemas";
import { deleteBudgetService, updateBudgetService } from "../services";

type Params = RouteContext<{ tripId: string; budgetId: string }>;

async function putHandler(req: NextRequest, context: OptionalAuthContext, { params }: Params) {
  try {
    if (context.isGuest) {
      throw new ForbiddenError("Guest access not allowed for updating budgets");
    }
    const { tripId, budgetId } = await params;
    const body = updateBudgetSchema.parse(await req.json());
    const budget = await updateBudgetService(context.decodedToken, tripId, budgetId, body);
    return NextResponse.json({ budget });
  } catch (error) {
    return handleApiError(error);
  }
}

async function deleteHandler(_req: NextRequest, context: OptionalAuthContext, { params }: Params) {
  try {
    if (context.isGuest) {
      throw new ForbiddenError("Guest access not allowed for deleting budgets");
    }
    const { tripId, budgetId } = await params;
    await deleteBudgetService(context.decodedToken, tripId, budgetId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export const PUT = withOptionalAuth(putHandler);
export const DELETE = withOptionalAuth(deleteHandler);
```

- [ ] **Step 3: Verify types and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: 0 type errors, 0 lint errors (the 22 pre-existing warnings are fine; no new warnings).

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/trips/[tripId]/budgets/route.ts" "src/app/api/trips/[tripId]/budgets/[budgetId]/route.ts"
git commit -m "refactor: use context.params and handleApiError in budgets route handlers"
```

---

### Task 4: Verification and PR

**Files:** None (verification + git operations only).

- [ ] **Step 1: Full verification**

Run: `npm run lint && npx tsc --noEmit && npm run test`
Expected: all green.

- [ ] **Step 2: Manual verification, to the extent the environment allows**

If a reachable database/Firebase backend exists: add a budget with and without a linked activity, edit a budget that has NO linked activity (this is the case bug fix (e) targets — it should now succeed), toggle "booked", delete one. If no backend is reachable (as in every prior migration), say so explicitly rather than claiming verification.

- [ ] **Step 3: Push and open the PR**

```bash
git push -u origin refactor/trips-budgets-service-repo
gh pr create --base dev --head refactor/trips-budgets-service-repo \
  --title "refactor: migrate Trip Budgets to service/repository architecture" \
  --body "<summarize: shared verifyTripAccess helper, budgets repository/service/routes, the behavior changes (a)-(e) from Global Constraints with the activityId '' bug fix called out, and that manual QA was not possible>"
gh pr checks --watch
```

---

## Definition of Done

- [ ] `src/app/api/trips/access.ts` + `repository.ts` exist and are tested; nothing else imports them yet except Budgets.
- [ ] Budgets `services.ts` no longer imports `@/lib/prisma`, has no private `verifyTripAccess`, and both routes validate with Zod, use `context.params`, and use `handleApiError`.
- [ ] Guest requests still get a 403 with the same messages; verbs and success response shapes are unchanged.
- [ ] The empty-string `activityId` on update is stored as `null` and is covered by a test.
- [ ] PR open with `checks` green, and its description lists the behavior changes, including the bug fix.
