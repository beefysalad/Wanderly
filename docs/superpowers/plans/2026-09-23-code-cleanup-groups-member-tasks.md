# Groups Member Tasks Feature Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the "Groups → Member Tasks" sub-unit (`/api/groups/[groupId]/member-tasks`, `/api/groups/[groupId]/member-tasks/[taskId]`, and the `Members` page component that is actually the member-tasks UI) to the repository/service/route architecture and component-decomposition conventions.

**Architecture:** `member-tasks/services.ts` (221 lines) duplicates a `getOrCreateUser`/`verifyGroupMembership` pattern that `groups/services.ts` already solved in the just-merged Groups-core migration. Rather than re-duplicating it, this feature's `services.ts` imports `findGroupMembership`/`findGroupOwnership` directly from the sibling `../../repository` (Groups core's repository, already on `dev`) for the membership/ownership checks, and gets its own local `repository.ts` only for `MemberTask`-model Prisma calls. Typed errors replace `throw new Error(...)` + string-matching in route catch blocks. The 352-line `Members/index.tsx` page (stats header + assign-task form + members list + tasks list) is split into `AssignTaskForm`, `MembersList`, `TasksList`.

**Tech Stack:** Next.js 15 App Router, Prisma, Zod, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-22-code-cleanup-design.md`

**Depends on:** Groups core (`src/app/api/groups/repository.ts`, `services.ts`, and the `context.params`-forwarding `withAuth` from Foundation) — all already merged to `dev`.

**Out of scope:** Groups' nested Trips resource (`[groupId]/trips/**`) — a separate sub-unit, queued after this one.

## Global Constraints

- No AI/Claude Code attribution in commit messages or PR descriptions.
- One branch/PR (`refactor/groups-member-tasks-service-repo`), based on `dev`, left fully working at the end.
- `syncUserToDatabaseService` is an external dependency — call as-is, don't modify.
- Reuse `findGroupMembership`/`findGroupOwnership` from `src/app/api/groups/repository.ts` (import as `../../repository` from within `member-tasks/`) rather than adding new near-duplicate functions — this is the whole point of doing Member Tasks right after Groups core.
- No behavior change beyond: (a) request bodies validated with Zod before reaching a service (error response shape now matches `handleApiError`'s ZodError branch); (b) unexpected errors return a generic message instead of leaking `error.message`.

---

### Task 1: Repository, schemas, and services

**Files:**
- Create: `src/app/api/groups/[groupId]/member-tasks/repository.ts`
- Create: `src/app/api/groups/[groupId]/member-tasks/schemas.ts`
- Modify: `src/app/api/groups/[groupId]/member-tasks/services.ts`
- Create: `src/app/api/groups/[groupId]/member-tasks/services.test.ts`

**Interfaces:**
- Consumes: `NotFoundError`, `ForbiddenError`, `ValidationError` from `@/lib/errors`; `findGroupMembership`, `findGroupOwnership` from `../../repository` (Groups core, already on `dev`).
- Produces: `listMemberTasksByGroup`, `findMemberTaskById`, `createMemberTaskRow`, `updateMemberTaskRow`, `deleteMemberTaskRow` from `repository.ts`. `createMemberTaskSchema`, `updateMemberTaskSchema` from `schemas.ts`. Service function names/signatures unchanged from today.

- [ ] **Step 1: Create the repository**

Create `src/app/api/groups/[groupId]/member-tasks/repository.ts`:

```ts
import prisma from "@/lib/prisma";
import type { MemberTaskStatus, Prisma } from "@prisma/client";

const MEMBER_TASK_INCLUDE = {
  assignedTo: { select: { id: true, name: true, email: true, imageUrl: true } },
  createdBy: { select: { id: true, name: true, email: true } },
} satisfies Prisma.MemberTaskInclude;

export function listMemberTasksByGroup(groupId: string) {
  return prisma.memberTask.findMany({
    where: { groupId },
    include: MEMBER_TASK_INCLUDE,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export function findMemberTaskById(taskId: string) {
  return prisma.memberTask.findUnique({
    where: { id: taskId },
    select: { id: true, groupId: true },
  });
}

export interface CreateMemberTaskRow {
  groupId: string;
  assignedToId: string;
  createdById: string;
  title: string;
  notes: string | null;
  dueDate: Date | null;
  status: MemberTaskStatus;
}

export function createMemberTaskRow(data: CreateMemberTaskRow) {
  return prisma.memberTask.create({ data, include: MEMBER_TASK_INCLUDE });
}

export interface UpdateMemberTaskRow {
  assignedToId?: string;
  title?: string;
  notes?: string | null;
  dueDate?: Date | null;
  status?: MemberTaskStatus;
}

export function updateMemberTaskRow(taskId: string, data: UpdateMemberTaskRow) {
  return prisma.memberTask.update({
    where: { id: taskId },
    data,
    include: MEMBER_TASK_INCLUDE,
  });
}

export function deleteMemberTaskRow(taskId: string) {
  return prisma.memberTask.delete({ where: { id: taskId } });
}
```

(No test file for this one — thin Prisma passthroughs aren't unit tested in this pass.)

- [ ] **Step 2: Create the Zod schemas**

Create `src/app/api/groups/[groupId]/member-tasks/schemas.ts`:

```ts
import { z } from "zod";

const memberTaskStatusSchema = z.enum(["not_started", "in_progress", "done"]);

// `null` must be tried before `z.coerce.date()` — coercing `null` through
// `new Date(null)` silently succeeds (epoch), so putting date first in the
// union would swallow explicit null-clearing instead of matching it.
const dueDateSchema = z.union([z.null(), z.coerce.date()]).optional();

export const createMemberTaskSchema = z.object({
  assignedToId: z.string().min(1, "assignedToId is required"),
  title: z.string().trim().min(1, "title is required"),
  notes: z.string().nullable().optional(),
  dueDate: dueDateSchema,
  status: memberTaskStatusSchema.optional(),
});
export type CreateMemberTaskBody = z.infer<typeof createMemberTaskSchema>;

export const updateMemberTaskSchema = z.object({
  assignedToId: z.string().min(1).optional(),
  title: z.string().trim().min(1).optional(),
  notes: z.string().nullable().optional(),
  dueDate: dueDateSchema,
  status: memberTaskStatusSchema.optional(),
});
export type UpdateMemberTaskBody = z.infer<typeof updateMemberTaskSchema>;
```

- [ ] **Step 3: Write the failing tests for the services**

Create `src/app/api/groups/[groupId]/member-tasks/services.test.ts`:

```ts
import type { DecodedIdToken } from "firebase-admin/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";

const mockFindGroupMembership = vi.fn();
const mockFindGroupOwnership = vi.fn();
vi.mock("../../repository", () => ({
  findGroupMembership: (...a: unknown[]) => mockFindGroupMembership(...a),
  findGroupOwnership: (...a: unknown[]) => mockFindGroupOwnership(...a),
}));

const mockListMemberTasksByGroup = vi.fn();
const mockFindMemberTaskById = vi.fn();
const mockCreateMemberTaskRow = vi.fn();
const mockUpdateMemberTaskRow = vi.fn();
const mockDeleteMemberTaskRow = vi.fn();
vi.mock("./repository", () => ({
  listMemberTasksByGroup: (...a: unknown[]) => mockListMemberTasksByGroup(...a),
  findMemberTaskById: (...a: unknown[]) => mockFindMemberTaskById(...a),
  createMemberTaskRow: (...a: unknown[]) => mockCreateMemberTaskRow(...a),
  updateMemberTaskRow: (...a: unknown[]) => mockUpdateMemberTaskRow(...a),
  deleteMemberTaskRow: (...a: unknown[]) => mockDeleteMemberTaskRow(...a),
}));

const mockSyncUserToDatabaseService = vi.fn();
vi.mock("../../../sync/syncService", () => ({
  syncUserToDatabaseService: (...a: unknown[]) => mockSyncUserToDatabaseService(...a),
}));

const {
  createMemberTaskService,
  deleteMemberTaskService,
  listMemberTasksService,
  updateMemberTaskService,
} = await import("./services");

const token = { uid: "firebase-1" } as DecodedIdToken;
const user = { id: "user-1", name: "Alice", email: "alice@example.com" };

beforeEach(() => {
  vi.clearAllMocks();
  mockSyncUserToDatabaseService.mockResolvedValue(user);
});

describe("listMemberTasksService", () => {
  it("throws ForbiddenError when the user isn't a group member", async () => {
    mockFindGroupMembership.mockResolvedValue(null);

    await expect(listMemberTasksService(token, "group-1")).rejects.toThrow(ForbiddenError);
    expect(mockListMemberTasksByGroup).not.toHaveBeenCalled();
  });

  it("throws NotFoundError when the group doesn't exist", async () => {
    mockFindGroupMembership.mockResolvedValue({ groupId: "group-1", userId: "user-1" });
    mockFindGroupOwnership.mockResolvedValue(null);

    await expect(listMemberTasksService(token, "group-1")).rejects.toThrow(NotFoundError);
  });

  it("returns the group's tasks when membership is verified", async () => {
    mockFindGroupMembership.mockResolvedValue({ groupId: "group-1", userId: "user-1" });
    mockFindGroupOwnership.mockResolvedValue({ createdById: "user-1", name: "Trip Squad" });
    mockListMemberTasksByGroup.mockResolvedValue([{ id: "task-1" }]);

    const result = await listMemberTasksService(token, "group-1");

    expect(mockListMemberTasksByGroup).toHaveBeenCalledWith("group-1");
    expect(result).toEqual([{ id: "task-1" }]);
  });
});

describe("createMemberTaskService", () => {
  beforeEach(() => {
    mockFindGroupOwnership.mockResolvedValue({ createdById: "user-1", name: "Trip Squad" });
  });

  it("throws ForbiddenError when the creator isn't a group member", async () => {
    mockFindGroupMembership.mockResolvedValue(null);

    await expect(
      createMemberTaskService(token, "group-1", { assignedToId: "user-2", title: "Book flights" }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("throws ValidationError when the assignee isn't a group member", async () => {
    mockFindGroupMembership
      .mockResolvedValueOnce({ groupId: "group-1", userId: "user-1" }) // creator check
      .mockResolvedValueOnce(null); // assignee check

    await expect(
      createMemberTaskService(token, "group-1", { assignedToId: "user-2", title: "Book flights" }),
    ).rejects.toThrow(ValidationError);
    expect(mockCreateMemberTaskRow).not.toHaveBeenCalled();
  });

  it("creates the task with defaults applied", async () => {
    mockFindGroupMembership
      .mockResolvedValueOnce({ groupId: "group-1", userId: "user-1" })
      .mockResolvedValueOnce({ groupId: "group-1", userId: "user-2" });
    mockCreateMemberTaskRow.mockResolvedValue({ id: "task-1" });

    await createMemberTaskService(token, "group-1", {
      assignedToId: "user-2",
      title: "Book flights",
    });

    expect(mockCreateMemberTaskRow).toHaveBeenCalledWith({
      groupId: "group-1",
      assignedToId: "user-2",
      createdById: "user-1",
      title: "Book flights",
      notes: null,
      dueDate: null,
      status: "not_started",
    });
  });
});

describe("updateMemberTaskService", () => {
  it("throws ForbiddenError when the user isn't a group member", async () => {
    mockFindGroupMembership.mockResolvedValue(null);

    await expect(
      updateMemberTaskService(token, "group-1", "task-1", { title: "New title" }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("throws NotFoundError when the task doesn't belong to this group", async () => {
    mockFindGroupMembership.mockResolvedValue({ groupId: "group-1", userId: "user-1" });
    mockFindMemberTaskById.mockResolvedValue({ id: "task-1", groupId: "other-group" });

    await expect(
      updateMemberTaskService(token, "group-1", "task-1", { title: "New title" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("throws ValidationError when reassigning to a non-member", async () => {
    mockFindGroupMembership
      .mockResolvedValueOnce({ groupId: "group-1", userId: "user-1" })
      .mockResolvedValueOnce(null);
    mockFindMemberTaskById.mockResolvedValue({ id: "task-1", groupId: "group-1" });

    await expect(
      updateMemberTaskService(token, "group-1", "task-1", { assignedToId: "user-99" }),
    ).rejects.toThrow(ValidationError);
    expect(mockUpdateMemberTaskRow).not.toHaveBeenCalled();
  });

  it("updates only the provided fields", async () => {
    mockFindGroupMembership.mockResolvedValue({ groupId: "group-1", userId: "user-1" });
    mockFindMemberTaskById.mockResolvedValue({ id: "task-1", groupId: "group-1" });
    mockUpdateMemberTaskRow.mockResolvedValue({ id: "task-1", status: "done" });

    await updateMemberTaskService(token, "group-1", "task-1", { status: "done" });

    expect(mockUpdateMemberTaskRow).toHaveBeenCalledWith("task-1", { status: "done" });
  });
});

describe("deleteMemberTaskService", () => {
  it("throws ForbiddenError when the user isn't a group member", async () => {
    mockFindGroupMembership.mockResolvedValue(null);

    await expect(deleteMemberTaskService(token, "group-1", "task-1")).rejects.toThrow(
      ForbiddenError,
    );
  });

  it("throws NotFoundError when the task doesn't belong to this group", async () => {
    mockFindGroupMembership.mockResolvedValue({ groupId: "group-1", userId: "user-1" });
    mockFindMemberTaskById.mockResolvedValue(null);

    await expect(deleteMemberTaskService(token, "group-1", "task-1")).rejects.toThrow(
      NotFoundError,
    );
    expect(mockDeleteMemberTaskRow).not.toHaveBeenCalled();
  });

  it("deletes the task when it belongs to the group", async () => {
    mockFindGroupMembership.mockResolvedValue({ groupId: "group-1", userId: "user-1" });
    mockFindMemberTaskById.mockResolvedValue({ id: "task-1", groupId: "group-1" });

    await deleteMemberTaskService(token, "group-1", "task-1");

    expect(mockDeleteMemberTaskRow).toHaveBeenCalledWith("task-1");
  });
});
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `npm run test -- "src/app/api/groups/[groupId]/member-tasks/services.test.ts"`
Expected: FAIL — `services.ts` still imports its own local `getOrCreateUser`/`verifyGroupMembership` and calls `prisma` directly, so none of the mocked functions get called and the assertions fail.

- [ ] **Step 5: Rewrite the services**

Replace the full contents of `src/app/api/groups/[groupId]/member-tasks/services.ts`:

```ts
import { logger } from "@/lib/logger";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import type { DecodedIdToken } from "firebase-admin/auth";
import type { MemberTaskStatus } from "@prisma/client";
import { syncUserToDatabaseService } from "../../../sync/syncService";
import { findGroupMembership, findGroupOwnership } from "../../repository";
import {
  createMemberTaskRow,
  deleteMemberTaskRow,
  findMemberTaskById,
  listMemberTasksByGroup,
  updateMemberTaskRow,
} from "./repository";
import type { CreateMemberTaskBody, UpdateMemberTaskBody } from "./schemas";

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

export async function listMemberTasksService(token: DecodedIdToken, groupId: string) {
  await verifyGroupMembership(token, groupId);
  return listMemberTasksByGroup(groupId);
}

export async function createMemberTaskService(
  token: DecodedIdToken,
  groupId: string,
  data: CreateMemberTaskBody,
) {
  const { user, group } = await verifyGroupMembership(token, groupId);

  const assigneeMembership = await findGroupMembership(groupId, data.assignedToId);
  if (!assigneeMembership) {
    throw new ValidationError("Assignee must be a member of this group");
  }

  const task = await createMemberTaskRow({
    groupId,
    assignedToId: data.assignedToId,
    createdById: user.id,
    title: data.title,
    notes: data.notes ?? null,
    dueDate: data.dueDate ?? null,
    status: (data.status ?? "not_started") as MemberTaskStatus,
  });

  logger.info("Member task created", {
    taskId: task.id,
    groupId,
    createdById: user.id,
    groupName: group.name,
  });

  return task;
}

export async function updateMemberTaskService(
  token: DecodedIdToken,
  groupId: string,
  taskId: string,
  updates: UpdateMemberTaskBody,
) {
  await verifyGroupMembership(token, groupId);

  const existingTask = await findMemberTaskById(taskId);
  if (!existingTask || existingTask.groupId !== groupId) {
    throw new NotFoundError("Task not found");
  }

  if (updates.assignedToId) {
    const assigneeMembership = await findGroupMembership(groupId, updates.assignedToId);
    if (!assigneeMembership) {
      throw new ValidationError("Assignee must be a member of this group");
    }
  }

  return updateMemberTaskRow(taskId, {
    ...(updates.assignedToId !== undefined && { assignedToId: updates.assignedToId }),
    ...(updates.title !== undefined && { title: updates.title }),
    ...(updates.notes !== undefined && { notes: updates.notes ?? null }),
    ...(updates.dueDate !== undefined && { dueDate: updates.dueDate ?? null }),
    ...(updates.status !== undefined && { status: updates.status as MemberTaskStatus }),
  });
}

export async function deleteMemberTaskService(
  token: DecodedIdToken,
  groupId: string,
  taskId: string,
) {
  await verifyGroupMembership(token, groupId);

  const existingTask = await findMemberTaskById(taskId);
  if (!existingTask || existingTask.groupId !== groupId) {
    throw new NotFoundError("Task not found");
  }

  await deleteMemberTaskRow(taskId);
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm run test -- "src/app/api/groups/[groupId]/member-tasks/services.test.ts"`
Expected: PASS — 12 tests passed.

- [ ] **Step 7: Run the full suite and typecheck**

Run: `npm run test`
Expected: all tests pass, no regressions.

Run: `npx tsc --noEmit`
Expected: this may show 0 or 1 error, depending on whether the two route files' existing calls into `services.ts` still line up structurally with the rewritten function signatures. If there is an error, confirm it is confined to `route.ts` and/or `[taskId]/route.ts` (Task 2's files, not touched yet) and nothing else — that's expected and Task 2 resolves it. If the error is anywhere else, stop and report it; that would be a real problem with this task's own code, not the known boundary case.

- [ ] **Step 8: Commit**

```bash
git add "src/app/api/groups/[groupId]/member-tasks/repository.ts" "src/app/api/groups/[groupId]/member-tasks/schemas.ts" "src/app/api/groups/[groupId]/member-tasks/services.ts" "src/app/api/groups/[groupId]/member-tasks/services.test.ts"
git commit -m "refactor: split group member-tasks API into repository/service layers, reuse Groups-core repository for membership checks"
```

---

### Task 2: Route handlers

**Files:**
- Modify: `src/app/api/groups/[groupId]/member-tasks/route.ts`
- Modify: `src/app/api/groups/[groupId]/member-tasks/[taskId]/route.ts`

**Interfaces:**
- Consumes: `RouteContext` from `@/lib/auth/with-auth`; everything from `./services` and `./schemas` (Task 1).

- [ ] **Step 1: Rewrite `src/app/api/groups/[groupId]/member-tasks/route.ts`**

```ts
import { withAuth, type AuthContext, type RouteContext } from "@/lib/auth/with-auth";
import { handleApiError } from "@/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { createMemberTaskSchema } from "./schemas";
import { createMemberTaskService, listMemberTasksService } from "./services";

type Params = RouteContext<{ groupId: string }>;

async function getHandler(_req: NextRequest, auth: AuthContext, { params }: Params) {
  try {
    const { groupId } = await params;
    const tasks = await listMemberTasksService(auth.decodedToken, groupId);
    return NextResponse.json({ tasks }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

async function postHandler(req: NextRequest, auth: AuthContext, { params }: Params) {
  try {
    const { groupId } = await params;
    const body = createMemberTaskSchema.parse(await req.json());
    const task = await createMemberTaskService(auth.decodedToken, groupId, body);
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
```

- [ ] **Step 2: Rewrite `src/app/api/groups/[groupId]/member-tasks/[taskId]/route.ts`**

```ts
import { withAuth, type AuthContext, type RouteContext } from "@/lib/auth/with-auth";
import { handleApiError } from "@/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { updateMemberTaskSchema } from "../schemas";
import { deleteMemberTaskService, updateMemberTaskService } from "../services";

type Params = RouteContext<{ groupId: string; taskId: string }>;

async function patchHandler(req: NextRequest, auth: AuthContext, { params }: Params) {
  try {
    const { groupId, taskId } = await params;
    const body = updateMemberTaskSchema.parse(await req.json());
    const task = await updateMemberTaskService(auth.decodedToken, groupId, taskId, body);
    return NextResponse.json({ task }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

async function deleteHandler(_req: NextRequest, auth: AuthContext, { params }: Params) {
  try {
    const { groupId, taskId } = await params;
    await deleteMemberTaskService(auth.decodedToken, groupId, taskId);
    return NextResponse.json({ message: "Task deleted" }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export const PATCH = withAuth(patchHandler);
export const DELETE = withAuth(deleteHandler);
```

- [ ] **Step 3: Verify types and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors (this resolves the transient error from Task 1's Step 7).

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/groups/[groupId]/member-tasks/route.ts" "src/app/api/groups/[groupId]/member-tasks/[taskId]/route.ts"
git commit -m "refactor: use context.params and handleApiError in member-tasks route handlers"
```

---

### Task 3: Component decomposition

**Files:**
- Create: `src/app/components/pages/Members/components/AssignTaskForm.tsx`
- Create: `src/app/components/pages/Members/components/MembersList.tsx`
- Create: `src/app/components/pages/Members/components/TasksList.tsx`
- Modify: `src/app/components/pages/Members/index.tsx`

**Interfaces:**
- Produces: `AssignTaskForm`, `MembersList`, `TasksList` — consumed only by `Members/index.tsx`.

- [ ] **Step 1: Create the assign-task form component**

Create `src/app/components/pages/Members/components/AssignTaskForm.tsx`:

```tsx
"use client";
import { Plus } from "lucide-react";

interface AssignTaskFormProps {
  title: string;
  onTitleChange: (value: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  dueDate: string;
  onDueDateChange: (value: string) => void;
  assignedToId: string;
  onAssignedToIdChange: (value: string) => void;
  members: { userId: string; email: string; displayName: string }[];
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function AssignTaskForm({
  title,
  onTitleChange,
  notes,
  onNotesChange,
  dueDate,
  onDueDateChange,
  assignedToId,
  onAssignedToIdChange,
  members,
  isSubmitting,
  onSubmit,
}: AssignTaskFormProps) {
  return (
    <section className='mb-6 border border-slate-800 rounded-2xl bg-slate-900 p-4 sm:p-5'>
      <div className='mb-3 flex items-center gap-2'>
        <Plus className='h-4 w-4 text-amber-400' />
        <h2 className='text-base font-semibold text-white'>Assign Task</h2>
      </div>

      <form onSubmit={onSubmit} className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder='Task title'
          className='h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500'
          required
        />

        <select
          value={assignedToId}
          onChange={(e) => onAssignedToIdChange(e.target.value)}
          className='h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-slate-500'
          required
        >
          <option value=''>Assign to member</option>
          {members.map((member) => (
            <option key={member.email} value={member.userId}>
              {member.displayName}
            </option>
          ))}
        </select>

        <input
          type='date'
          value={dueDate}
          onChange={(e) => onDueDateChange(e.target.value)}
          className='h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-slate-500'
        />

        <button
          type='submit'
          disabled={isSubmitting}
          className='h-11 rounded-xl bg-amber-500 text-slate-950 text-sm font-semibold transition hover:bg-amber-400 disabled:opacity-60'
        >
          {isSubmitting ? "Assigning..." : "Assign Task"}
        </button>

        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder='Optional notes'
          className='sm:col-span-2 min-h-[84px] rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 resize-none'
        />
      </form>
    </section>
  );
}
```

Note: this component takes `members` as a pre-shaped `{ userId, email, displayName }[]` array rather than the raw group data — `index.tsx` is responsible for deriving that shape (it already computes `displayName` and has `group.memberIds`), so this component stays presentational with no knowledge of the `Group` type's internals.

- [ ] **Step 2: Create the members-list component**

Create `src/app/components/pages/Members/components/MembersList.tsx`:

```tsx
import { Crown, Mail, User, Users } from "lucide-react";
import Image from "next/image";

interface MemberRow {
  email: string;
  displayName: string;
  isCreator: boolean;
  imageUrl?: string;
  openTaskCount: number;
}

interface MembersListProps {
  members: MemberRow[];
}

function getInitials(email: string) {
  return email.substring(0, 2).toUpperCase();
}

export function MembersList({ members }: MembersListProps) {
  return (
    <section className='mb-6 border border-slate-800 rounded-2xl bg-slate-900 p-3 sm:p-4'>
      <h2 className='px-1 pb-3 text-sm font-semibold text-white'>Members</h2>

      {members.length === 0 ? (
        <div className='rounded-xl border border-dashed border-slate-700 p-8 text-center'>
          <Users className='mx-auto h-6 w-6 text-slate-500 mb-2' />
          <p className='text-sm text-slate-400'>No members yet.</p>
        </div>
      ) : (
        <div className='space-y-2'>
          {members.map((member) => (
            <div
              key={member.email}
              className='flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 px-3 py-3'
            >
              {member.imageUrl ? (
                <div className='relative h-11 w-11 overflow-hidden rounded-full border border-slate-700'>
                  <Image
                    src={member.imageUrl}
                    alt={member.displayName}
                    fill
                    className='object-cover'
                  />
                </div>
              ) : (
                <div className='flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-xs font-semibold text-slate-200'>
                  {member.email ? getInitials(member.email) : <User className='h-4 w-4' />}
                </div>
              )}

              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-2'>
                  <p className='truncate text-sm font-medium text-white'>
                    {member.displayName}
                  </p>
                  {member.isCreator && (
                    <span className='inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300'>
                      <Crown className='h-3 w-3' />
                      Creator
                    </span>
                  )}
                </div>
                <div className='mt-0.5 flex items-center gap-1.5 text-xs text-slate-400'>
                  <Mail className='h-3.5 w-3.5' />
                  <span className='truncate'>{member.email}</span>
                </div>
              </div>

              <div className='rounded-lg border border-slate-700 px-2.5 py-1 text-xs text-slate-300'>
                {member.openTaskCount} open
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 3: Create the tasks-list component**

Create `src/app/components/pages/Members/components/TasksList.tsx`:

```tsx
import { Trash2 } from "lucide-react";
import type { MemberTask } from "@/src/shared/types";

type TaskStatus = "not_started" | "in_progress" | "done";

const STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  done: "Done",
};

interface TasksListProps {
  tasks: MemberTask[];
  isLoading: boolean;
  assigneeNameFor: (task: MemberTask) => string;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
  isDeleting: boolean;
}

export function TasksList({
  tasks,
  isLoading,
  assigneeNameFor,
  onStatusChange,
  onDelete,
  isDeleting,
}: TasksListProps) {
  return (
    <section className='border border-slate-800 rounded-2xl bg-slate-900 p-3 sm:p-4'>
      <h2 className='px-1 pb-3 text-sm font-semibold text-white'>All Tasks</h2>

      {isLoading ? (
        <div className='p-6 text-sm text-slate-400'>Loading</div>
      ) : tasks.length === 0 ? (
        <div className='rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400'>
          No tasks yet. Assign one above.
        </div>
      ) : (
        <div className='space-y-2'>
          {tasks.map((task) => (
            <div
              key={task.id}
              className='rounded-xl border border-slate-800 bg-slate-950 px-3 py-3'
            >
              <div className='flex flex-wrap items-start justify-between gap-2'>
                <div className='min-w-0'>
                  <p className='truncate text-sm font-medium text-white'>{task.title}</p>
                  <p className='mt-0.5 text-xs text-slate-400'>
                    Assigned to {assigneeNameFor(task)}
                  </p>
                  {task.notes && (
                    <p className='mt-1 text-xs text-slate-500 line-clamp-2'>{task.notes}</p>
                  )}
                </div>

                <button
                  onClick={() => onDelete(task.id)}
                  disabled={isDeleting}
                  className='rounded-lg border border-slate-700 p-2 text-slate-500 hover:text-red-300 hover:border-red-500/40 transition-colors'
                  aria-label='Delete task'
                  type='button'
                >
                  <Trash2 className='h-4 w-4' />
                </button>
              </div>

              <div className='mt-3 flex flex-wrap items-center gap-2'>
                <select
                  value={task.status}
                  onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                  className='h-8 rounded-lg border border-slate-700 bg-slate-900 px-2 text-xs text-slate-200'
                >
                  <option value='not_started'>{STATUS_LABELS.not_started}</option>
                  <option value='in_progress'>{STATUS_LABELS.in_progress}</option>
                  <option value='done'>{STATUS_LABELS.done}</option>
                </select>

                {task.dueDate && (
                  <span className='text-xs text-slate-500'>
                    Due{" "}
                    {new Date(task.dueDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Slim down `index.tsx` to orchestrate the three components**

Replace the full contents of `src/app/components/pages/Members/index.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import React, { useCallback, useMemo, useState } from "react";
import PremiumPageHeader from "../../shared/PremiumPageHeader";
import { useGroup } from "@/src/hooks/useGroups";
import {
  useCreateMemberTask,
  useDeleteMemberTask,
  useMemberTasks,
  useUpdateMemberTask,
} from "@/src/hooks/useMemberTasks";
import LoadingState from "../../shared/LoadingState";
import { AssignTaskForm } from "./components/AssignTaskForm";
import { MembersList } from "./components/MembersList";
import { TasksList } from "./components/TasksList";

interface IMembersComponent {
  groupId: string;
}

type TaskStatus = "not_started" | "in_progress" | "done";

const MembersComponent = ({ groupId }: IMembersComponent) => {
  const router = useRouter();
  const { data: groupData, isLoading: loading } = useGroup(groupId);
  const { data: tasksData, isLoading: tasksLoading } = useMemberTasks(groupId);
  const createTask = useCreateMemberTask(groupId);
  const updateTask = useUpdateMemberTask(groupId);
  const deleteTask = useDeleteMemberTask(groupId);

  const group = groupData?.group || null;
  const tasks = useMemo(() => tasksData?.tasks ?? [], [tasksData?.tasks]);

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignedToId, setAssignedToId] = useState("");

  const displayName = useCallback(
    (email: string) =>
      group?.memberNames?.[email] ||
      group?.memberMetadata?.[email]?.name ||
      email.split("@")[0],
    [group?.memberMetadata, group?.memberNames],
  );

  const memberEmails = useMemo(() => {
    if (!group?.memberEmails) return [];

    return [...group.memberEmails].sort((a, b) => {
      const aIsCreator = a === group.createdByEmail || a === group.createdBy;
      const bIsCreator = b === group.createdByEmail || b === group.createdBy;
      if (aIsCreator && !bIsCreator) return -1;
      if (!aIsCreator && bIsCreator) return 1;
      return displayName(a).localeCompare(displayName(b));
    });
  }, [displayName, group?.createdBy, group?.createdByEmail, group?.memberEmails]);

  const emailByUserId = useMemo(() => {
    const map: Record<string, string> = {};
    if (!group?.memberIds) return map;

    for (const [email, userId] of Object.entries(group.memberIds)) {
      if (userId) map[userId] = email;
    }

    return map;
  }, [group?.memberIds]);

  const formMembers = useMemo(
    () =>
      memberEmails.flatMap((email) => {
        const userId = group?.memberIds?.[email];
        if (!userId) return [];
        return [{ userId, email, displayName: displayName(email) }];
      }),
    [displayName, group?.memberIds, memberEmails],
  );

  const memberRows = useMemo(
    () =>
      memberEmails.map((email) => {
        const isCreator = email === group?.createdByEmail || email === group?.createdBy;
        const memberMeta = group?.memberMetadata?.[email];
        const userId = group?.memberIds?.[email];
        const openTaskCount = userId
          ? tasks.filter((task) => task.assignedToId === userId && task.status !== "done").length
          : 0;

        return {
          email,
          displayName: displayName(email),
          isCreator,
          imageUrl: memberMeta?.imageUrl,
          openTaskCount,
        };
      }),
    [displayName, group?.createdBy, group?.createdByEmail, group?.memberIds, group?.memberMetadata, memberEmails, tasks],
  );

  const assigneeNameFor = useCallback(
    (task: (typeof tasks)[number]) => {
      const assigneeEmail = emailByUserId[task.assignedToId];
      return assigneeEmail ? displayName(assigneeEmail) : "Unknown member";
    },
    [displayName, emailByUserId],
  );

  const openTasks = tasks.filter((task) => task.status !== "done").length;
  const memberCount = memberEmails.length;

  const onAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignedToId || !title.trim()) return;

    await createTask.mutateAsync({
      assignedToId,
      title: title.trim(),
      notes: notes.trim() || undefined,
      dueDate: dueDate || undefined,
    });

    setTitle("");
    setNotes("");
    setDueDate("");
    setAssignedToId("");
  };

  if (loading) {
    return (
      <main className='min-h-screen bg-slate-950 p-6'>
        <LoadingState fullScreen />
      </main>
    );
  }

  if (!group) {
    return (
      <main className='min-h-screen bg-slate-950 flex items-center justify-center p-6'>
        <div className='text-center rounded-2xl border border-slate-800 bg-slate-900 px-8 py-7'>
          <p className='text-base text-slate-300'>Group not found.</p>
        </div>
      </main>
    );
  }

  return (
    <main className='min-h-screen bg-slate-950 pb-24 text-slate-200 font-sans'>
      <PremiumPageHeader title='Members' onBack={() => router.push(`/group/${groupId}`)} />

      <div className='mx-auto max-w-5xl px-4 pt-6 sm:px-6'>
        <section className='mb-6 border border-slate-800 rounded-2xl bg-slate-900 p-5'>
          <p className='text-xs uppercase tracking-[0.14em] text-slate-500'>Team</p>
          <h1 className='mt-2 text-2xl sm:text-3xl font-semibold text-white'>
            {group.name} Members
          </h1>
          <p className='mt-2 text-sm text-slate-400'>
            Keep responsibilities visible and aligned for everyone.
          </p>

          <div className='mt-4 grid grid-cols-3 gap-2'>
            <div className='rounded-xl border border-slate-800 px-3 py-3'>
              <p className='text-[11px] uppercase tracking-[0.12em] text-slate-500'>Members</p>
              <p className='mt-1 text-xl font-semibold text-white'>{memberCount}</p>
            </div>
            <div className='rounded-xl border border-slate-800 px-3 py-3'>
              <p className='text-[11px] uppercase tracking-[0.12em] text-slate-500'>Tasks</p>
              <p className='mt-1 text-xl font-semibold text-white'>{tasks.length}</p>
            </div>
            <div className='rounded-xl border border-slate-800 px-3 py-3'>
              <p className='text-[11px] uppercase tracking-[0.12em] text-slate-500'>Open</p>
              <p className='mt-1 text-xl font-semibold text-white'>{openTasks}</p>
            </div>
          </div>
        </section>

        <AssignTaskForm
          title={title}
          onTitleChange={setTitle}
          notes={notes}
          onNotesChange={setNotes}
          dueDate={dueDate}
          onDueDateChange={setDueDate}
          assignedToId={assignedToId}
          onAssignedToIdChange={setAssignedToId}
          members={formMembers}
          isSubmitting={createTask.isPending}
          onSubmit={onAssignTask}
        />

        <MembersList members={memberRows} />

        <TasksList
          tasks={tasks}
          isLoading={tasksLoading}
          assigneeNameFor={assigneeNameFor}
          onStatusChange={(taskId, status) => updateTask.mutate({ taskId, status })}
          onDelete={(taskId) => deleteTask.mutate(taskId)}
          isDeleting={deleteTask.isPending}
        />
      </div>
    </main>
  );
};

export default MembersComponent;
```

- [ ] **Step 5: Verify line counts and types**

Run: `wc -l src/app/components/pages/Members/index.tsx src/app/components/pages/Members/components/*.tsx`
Expected: `index.tsx` is roughly 190-210 lines (down from 352); each new file is under 300 lines.

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 6: Manual verification in the browser, to the extent the environment allows**

Run: `npm run dev`. If a reachable database/Firebase backend is available: open a group's Members page, confirm the stats/members list/task list render correctly, assign a task, change a task's status, delete a task. If no reachable backend is available (as has been the case for prior migrations), say so explicitly and rely on the test suite plus careful reading instead of claiming verification that didn't happen.

- [ ] **Step 7: Commit**

```bash
git add src/app/components/pages/Members
git commit -m "refactor: split Members page into assign-form/members-list/tasks-list components"
```

---

### Task 4: Verification and PR

**Files:** None (verification + git operations only).

- [ ] **Step 1: Run the full verification suite**

Run: `npm run lint && npx tsc --noEmit && npm run test`
Expected: all green.

- [ ] **Step 2: Push and open the PR**

```bash
git push -u origin refactor/groups-member-tasks-service-repo
gh pr create --base dev --head refactor/groups-member-tasks-service-repo \
  --title "refactor: migrate Groups Member Tasks to service/repository architecture" \
  --body "Migrates /api/groups/[groupId]/member-tasks(/[taskId]) to the repository/service/route layering from CLAUDE.md, adds Zod validation on both routes, and reuses the Groups-core repository's findGroupMembership/findGroupOwnership for membership checks instead of duplicating them. Splits the 352-line Members page (which is the member-tasks UI) into AssignTaskForm/MembersList/TasksList. Part of docs/superpowers/specs/2026-09-22-code-cleanup-design.md, Pass 1."
gh pr checks --watch
```

---

## Definition of Done

- [ ] `src/app/api/groups/[groupId]/member-tasks/repository.ts`, `schemas.ts` exist; `services.ts` no longer imports `@/lib/prisma` directly and reuses `../../repository`'s membership/ownership functions instead of duplicating them.
- [ ] Both routes validate their bodies with Zod, use `context.params`, and use `handleApiError`.
- [ ] `services.test.ts` passes and covers all 4 service functions' success and error-throwing paths.
- [ ] `Members/index.tsx` is under ~300 lines; `AssignTaskForm`, `MembersList`, `TasksList` each own one clear responsibility.
- [ ] PR open with the `checks` workflow green.
