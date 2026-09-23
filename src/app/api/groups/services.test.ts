import type { DecodedIdToken } from "firebase-admin/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";

const mockFindGroupById = vi.fn();
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
  mockCreateNotificationService.mockResolvedValue(undefined);
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
    mockFindGroupCodeLookup.mockResolvedValue(null);

    await expect(joinGroupService(token, "NOPE")).rejects.toThrow(NotFoundError);
  });

  it("throws ValidationError when the user is already a member", async () => {
    mockFindGroupCodeLookup.mockResolvedValue({ id: "group-1", name: "Trip Squad", code: "ABC123" });
    mockFindGroupMembership.mockResolvedValue({ groupId: "group-1", userId: "user-1" });

    await expect(joinGroupService(token, "ABC123")).rejects.toThrow(ValidationError);
    expect(mockAddGroupMember).not.toHaveBeenCalled();
  });

  it("adds the member and notifies existing members, excluding the joiner", async () => {
    mockFindGroupCodeLookup.mockResolvedValue({ id: "group-1", name: "Trip Squad", code: "ABC123" });
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
