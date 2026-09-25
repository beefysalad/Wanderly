import type { DecodedIdToken } from "firebase-admin/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "@/lib/errors";

const mockVerifyTripAccess = vi.fn();
vi.mock("../../access", () => ({
  verifyTripAccess: (...a: unknown[]) => mockVerifyTripAccess(...a),
}));

const mockFindActivityById = vi.fn();
const mockCreateActivityRow = vi.fn();
const mockUpdateActivityRow = vi.fn();
const mockDeleteActivityRow = vi.fn();
vi.mock("./repository", () => ({
  findActivityById: (...a: unknown[]) => mockFindActivityById(...a),
  createActivityRow: (...a: unknown[]) => mockCreateActivityRow(...a),
  updateActivityRow: (...a: unknown[]) => mockUpdateActivityRow(...a),
  deleteActivityRow: (...a: unknown[]) => mockDeleteActivityRow(...a),
}));

const mockListMembers = vi.fn();
vi.mock("../../../groups/repository", () => ({
  listGroupMembersForNotify: (...a: unknown[]) => mockListMembers(...a),
}));

const mockCreateNotification = vi.fn();
vi.mock("../../../notifications/services", () => ({
  createNotificationService: (...a: unknown[]) => mockCreateNotification(...a),
}));

const mockEmitCreated = vi.fn();
const mockEmitUpdated = vi.fn();
const mockEmitDeleted = vi.fn();
vi.mock("@/lib/socket-events", () => ({
  emitActivityCreated: (...a: unknown[]) => mockEmitCreated(...a),
  emitActivityUpdated: (...a: unknown[]) => mockEmitUpdated(...a),
  emitActivityDeleted: (...a: unknown[]) => mockEmitDeleted(...a),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

const { createActivityService, deleteActivityService, updateActivityService } = await import(
  "./services"
);

const token = { uid: "firebase-1" } as DecodedIdToken;
const user = { id: "user-1", name: "Alice", email: "alice@example.com" };
const trip = { id: "trip-1", groupId: "group-1", name: "Japan" };

beforeEach(() => {
  vi.clearAllMocks();
  mockVerifyTripAccess.mockResolvedValue({ trip, user });
  mockListMembers.mockResolvedValue([{ userId: "user-1" }, { userId: "user-2" }]);
  mockCreateNotification.mockResolvedValue(undefined);
  mockEmitCreated.mockResolvedValue(undefined);
  mockEmitUpdated.mockResolvedValue(undefined);
  mockEmitDeleted.mockResolvedValue(undefined);
});

describe("createActivityService", () => {
  it("normalizes empty optional fields to null, notifies other members only, and emits", async () => {
    mockCreateActivityRow.mockResolvedValue({ id: "act-1" });

    await createActivityService(token, "trip-1", {
      title: "Museum",
      date: new Date("2026-10-01"),
      startTime: "",
      notes: undefined,
    });

    expect(mockCreateActivityRow).toHaveBeenCalledWith(
      expect.objectContaining({ tripId: "trip-1", title: "Museum", startTime: null, notes: null }),
    );
    expect(mockCreateNotification).toHaveBeenCalledTimes(1);
    expect(mockCreateNotification).toHaveBeenCalledWith(
      "user-2",
      expect.objectContaining({
        relatedGroupId: "group-1",
        relatedActivityId: "act-1",
        message: "Alice added activity 'Museum' to Japan",
      }),
    );
    expect(mockEmitCreated).toHaveBeenCalledWith("group-1", { id: "act-1" }, {
      createdBy: "alice@example.com",
    });
  });

  it("still succeeds when a notification fails", async () => {
    mockCreateActivityRow.mockResolvedValue({ id: "act-1" });
    mockCreateNotification.mockRejectedValue(new Error("boom"));

    await expect(
      createActivityService(token, "trip-1", { title: "x", date: new Date() }),
    ).resolves.toEqual({ id: "act-1" });
  });
});

describe("updateActivityService", () => {
  it("throws NotFoundError when the activity belongs to another trip", async () => {
    mockFindActivityById.mockResolvedValue({ id: "a", tripId: "other", title: "t" });

    await expect(updateActivityService(token, "trip-1", "a", { done: true })).rejects.toThrow(
      NotFoundError,
    );
    expect(mockUpdateActivityRow).not.toHaveBeenCalled();
  });

  it("does not notify or emit for a non-significant change (done toggle)", async () => {
    mockFindActivityById.mockResolvedValue({ id: "a", tripId: "trip-1", title: "Old" });
    mockUpdateActivityRow.mockResolvedValue({ id: "a" });

    await updateActivityService(token, "trip-1", "a", { done: true });

    expect(mockUpdateActivityRow).toHaveBeenCalledWith("a", { done: true });
    expect(mockCreateNotification).not.toHaveBeenCalled();
    expect(mockEmitUpdated).not.toHaveBeenCalled();
  });

  it("notifies with the pre-update title and emits when the title changes", async () => {
    mockFindActivityById.mockResolvedValue({ id: "a", tripId: "trip-1", title: "Old" });
    mockUpdateActivityRow.mockResolvedValue({ id: "a" });

    await updateActivityService(token, "trip-1", "a", { title: "New", pickupTime: "" });

    expect(mockUpdateActivityRow).toHaveBeenCalledWith("a", { title: "New", pickupTime: null });
    expect(mockCreateNotification).toHaveBeenCalledWith(
      "user-2",
      expect.objectContaining({ message: "Alice updated activity 'Old' in Japan" }),
    );
    expect(mockEmitUpdated).toHaveBeenCalledTimes(1);
  });
});

describe("deleteActivityService", () => {
  it("throws NotFoundError when the activity is missing", async () => {
    mockFindActivityById.mockResolvedValue(null);

    await expect(deleteActivityService(token, "trip-1", "a")).rejects.toThrow(NotFoundError);
    expect(mockDeleteActivityRow).not.toHaveBeenCalled();
  });

  it("notifies before deleting, without relatedActivityId, then emits", async () => {
    mockFindActivityById.mockResolvedValue({ id: "a", tripId: "trip-1", title: "Museum" });
    const order: string[] = [];
    mockCreateNotification.mockImplementation(async () => void order.push("notify"));
    mockDeleteActivityRow.mockImplementation(async () => void order.push("delete"));

    await deleteActivityService(token, "trip-1", "a");

    expect(order).toEqual(["notify", "delete"]);
    expect(mockCreateNotification.mock.calls[0][1]).not.toHaveProperty("relatedActivityId");
    expect(mockEmitDeleted).toHaveBeenCalledWith("group-1", "a", {
      deletedBy: "Alice",
      activityTitle: "Museum",
    });
  });
});
