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
    mockFindGroupOwnership.mockResolvedValue({ createdById: "user-1", name: "Trip Squad" });
    mockFindMemberTaskById.mockResolvedValue({ id: "task-1", groupId: "group-1", createdById: "user-1" });
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
    mockFindGroupOwnership.mockResolvedValue({ createdById: "user-1", name: "Trip Squad" });
    mockFindMemberTaskById.mockResolvedValue({ id: "task-1", groupId: "group-1", createdById: "user-1" });

    await deleteMemberTaskService(token, "group-1", "task-1");

    expect(mockDeleteMemberTaskRow).toHaveBeenCalledWith("task-1");
  });
});

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
    mockSyncUserToDatabaseService.mockResolvedValue(user);
  });

  it("rejects update and delete by a member who is neither creator, assignee nor owner", async () => {
    mockFindMemberTaskById.mockResolvedValue(task());

    await expect(
      updateMemberTaskService(token, "group-1", "task-1", { status: "done" }),
    ).rejects.toThrow(ForbiddenError);
    await expect(deleteMemberTaskService(token, "group-1", "task-1")).rejects.toThrow(
      ForbiddenError,
    );
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
