import { beforeEach, describe, expect, it, vi } from "vitest";

const mockListMembers = vi.fn();
vi.mock("../groups/repository", () => ({
  listGroupMembersForNotify: (...a: unknown[]) => mockListMembers(...a),
}));

const mockCreateNotificationRows = vi.fn();
const mockFindUsersFirebaseIds = vi.fn();
vi.mock("./repository", () => ({
  createNotificationRows: (...a: unknown[]) => mockCreateNotificationRows(...a),
  findUsersFirebaseIds: (...a: unknown[]) => mockFindUsersFirebaseIds(...a),
}));

const mockEmitUser = vi.fn();
const mockEmitGroup = vi.fn();
vi.mock("@/lib/socket-events", () => ({
  emitNotificationToUser: (...a: unknown[]) => mockEmitUser(...a),
  emitNotificationChangedToGroup: (...a: unknown[]) => mockEmitGroup(...a),
}));

vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

const { notifyGroupMembers } = await import("./notifyMembers");

const notification = {
  type: "expense_added",
  title: "t",
  message: "m",
} as never;

beforeEach(() => {
  vi.clearAllMocks();
  mockListMembers.mockResolvedValue([{ userId: "u1" }, { userId: "u2" }, { userId: "u3" }]);
  mockCreateNotificationRows.mockResolvedValue([
    { id: "n2", userId: "u2" },
    { id: "n3", userId: "u3" },
  ]);
  mockFindUsersFirebaseIds.mockResolvedValue([
    { id: "u2", firebaseId: "fb-u2" },
    { id: "u3", firebaseId: "fb-u3" },
  ]);
  mockEmitUser.mockResolvedValue(undefined);
  mockEmitGroup.mockResolvedValue(undefined);
});

describe("notifyGroupMembers", () => {
  it("batches the DB insert into a single call for every recipient, excluding the caller", async () => {
    await notifyGroupMembers("g1", "u1", notification);

    expect(mockCreateNotificationRows).toHaveBeenCalledTimes(1);
    const rows = mockCreateNotificationRows.mock.calls[0][0];
    expect(rows).toHaveLength(2);
    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: "u2", relatedGroupId: "g1" }),
        expect.objectContaining({ userId: "u3", relatedGroupId: "g1" }),
      ]),
    );
  });

  it("looks up recipients' Firebase ids with a single batched findMany, not one per member", async () => {
    await notifyGroupMembers("g1", "u1", notification);

    expect(mockFindUsersFirebaseIds).toHaveBeenCalledTimes(1);
    expect(mockFindUsersFirebaseIds).toHaveBeenCalledWith(["u2", "u3"]);
  });

  it("emits to each recipient's own channel individually", async () => {
    await notifyGroupMembers("g1", "u1", notification);

    expect(mockEmitUser).toHaveBeenCalledTimes(2);
    expect(mockEmitUser).toHaveBeenCalledWith("fb-u2", { id: "n2", userId: "u2" });
    expect(mockEmitUser).toHaveBeenCalledWith("fb-u3", { id: "n3", userId: "u3" });
  });

  it("pings the group's room exactly once, not once per member", async () => {
    await notifyGroupMembers("g1", "u1", notification);

    expect(mockEmitGroup).toHaveBeenCalledTimes(1);
    expect(mockEmitGroup).toHaveBeenCalledWith("g1");
  });

  it("is a no-op when every member is excluded", async () => {
    mockListMembers.mockResolvedValue([{ userId: "u1" }]);

    await notifyGroupMembers("g1", "u1", notification);

    expect(mockCreateNotificationRows).not.toHaveBeenCalled();
    expect(mockFindUsersFirebaseIds).not.toHaveBeenCalled();
    expect(mockEmitGroup).not.toHaveBeenCalled();
  });

  it("skips the emit for a recipient with no Firebase id, without failing the others", async () => {
    mockFindUsersFirebaseIds.mockResolvedValue([
      { id: "u2", firebaseId: null },
      { id: "u3", firebaseId: "fb-u3" },
    ]);

    await notifyGroupMembers("g1", "u1", notification);

    expect(mockEmitUser).toHaveBeenCalledTimes(1);
    expect(mockEmitUser).toHaveBeenCalledWith("fb-u3", { id: "n3", userId: "u3" });
  });

  it("logs and returns without emitting when the batched insert fails", async () => {
    mockCreateNotificationRows.mockRejectedValue(new Error("boom"));

    await expect(notifyGroupMembers("g1", "u1", notification)).resolves.toBeUndefined();

    expect(mockFindUsersFirebaseIds).not.toHaveBeenCalled();
    expect(mockEmitUser).not.toHaveBeenCalled();
    expect(mockEmitGroup).not.toHaveBeenCalled();
  });

  it("still pings the group room when an individual user emit rejects", async () => {
    mockEmitUser.mockRejectedValueOnce(new Error("socket down")).mockResolvedValue(undefined);

    await expect(notifyGroupMembers("g1", "u1", notification)).resolves.toBeUndefined();

    expect(mockEmitGroup).toHaveBeenCalledTimes(1);
  });
});
