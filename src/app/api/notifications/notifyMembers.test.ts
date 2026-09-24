import { beforeEach, describe, expect, it, vi } from "vitest";

const mockListMembers = vi.fn();
vi.mock("../groups/repository", () => ({
  listGroupMembersForNotify: (...a: unknown[]) => mockListMembers(...a),
}));

const mockCreateNotification = vi.fn();
vi.mock("./services", () => ({
  createNotificationService: (...a: unknown[]) => mockCreateNotification(...a),
}));

vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

const { notifyGroupMembers } = await import("./notifyMembers");

const notification = { type: "expense_added", title: "t", message: "m" } as never;

beforeEach(() => {
  vi.clearAllMocks();
  mockListMembers.mockResolvedValue([{ userId: "u1" }, { userId: "u2" }, { userId: "u3" }]);
  mockCreateNotification.mockResolvedValue(undefined);
});

describe("notifyGroupMembers", () => {
  it("notifies everyone except the excluded user, stamping the group id", async () => {
    await notifyGroupMembers("g1", "u1", notification);

    expect(mockCreateNotification).toHaveBeenCalledTimes(2);
    expect(mockCreateNotification).toHaveBeenCalledWith("u2", expect.objectContaining({ relatedGroupId: "g1" }));
    expect(mockCreateNotification).toHaveBeenCalledWith("u3", expect.objectContaining({ relatedGroupId: "g1" }));
  });

  it("keeps notifying the rest when one member's notification fails", async () => {
    mockCreateNotification.mockRejectedValueOnce(new Error("boom")).mockResolvedValue(undefined);

    await expect(notifyGroupMembers("g1", "u1", notification)).resolves.toBeUndefined();
    expect(mockCreateNotification).toHaveBeenCalledTimes(2);
  });
});
