import type { DecodedIdToken } from "firebase-admin/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError, ValidationError } from "@/lib/errors";

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
// Stored like the app saves them: the picked day at UTC midnight.
const trip = {
  id: "trip-1",
  groupId: "group-1",
  name: "Japan",
  startDate: new Date("2026-10-01T00:00:00.000Z"),
  endDate: new Date("2026-10-05T00:00:00.000Z"),
};
const RANGE_ERROR = "Pick a date within the trip (2026-10-01 to 2026-10-05)";

const existingActivity = (over: Record<string, unknown> = {}) => ({
  id: "a",
  tripId: "trip-1",
  title: "Old",
  date: new Date("2026-10-02T00:00:00.000Z"),
  startTime: null,
  endTime: null,
  ...over,
});

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
      createActivityService(token, "trip-1", { title: "x", date: new Date("2026-10-01") }),
    ).resolves.toEqual({ id: "act-1" });
  });

  it("accepts the trip's first and last days", async () => {
    mockCreateActivityRow.mockResolvedValue({ id: "act-1" });

    await createActivityService(token, "trip-1", { title: "x", date: new Date("2026-10-01") });
    await createActivityService(token, "trip-1", { title: "x", date: new Date("2026-10-05") });

    expect(mockCreateActivityRow).toHaveBeenCalledTimes(2);
  });

  it("rejects a date before or after the trip without saving", async () => {
    for (const date of ["2026-09-30", "2026-10-06"]) {
      await expect(
        createActivityService(token, "trip-1", { title: "x", date: new Date(date) }),
      ).rejects.toThrow(new ValidationError(RANGE_ERROR));
    }
    expect(mockCreateActivityRow).not.toHaveBeenCalled();
  });

  it("judges the range by the picked day even for a trip end saved with a time", async () => {
    mockVerifyTripAccess.mockResolvedValue({
      trip: { ...trip, endDate: new Date("2026-10-05T15:00:00.000Z") },
      user,
    });
    mockCreateActivityRow.mockResolvedValue({ id: "act-1" });

    await expect(
      createActivityService(token, "trip-1", { title: "x", date: new Date("2026-10-05T20:00:00.000Z") }),
    ).resolves.toEqual({ id: "act-1" });
  });

  it("saves the location and stores an empty one as null", async () => {
    mockCreateActivityRow.mockResolvedValue({ id: "act-1" });

    await createActivityService(token, "trip-1", {
      title: "x",
      date: new Date("2026-10-02"),
      location: "Louvre, Paris",
    });
    await createActivityService(token, "trip-1", { title: "x", date: new Date("2026-10-02"), location: "" });

    expect(mockCreateActivityRow.mock.calls[0][0]).toMatchObject({ location: "Louvre, Paris" });
    expect(mockCreateActivityRow.mock.calls[1][0]).toMatchObject({ location: null });
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

  it("rejects moving the activity outside the trip", async () => {
    mockFindActivityById.mockResolvedValue(existingActivity());

    await expect(
      updateActivityService(token, "trip-1", "a", { date: new Date("2026-10-06") }),
    ).rejects.toThrow(new ValidationError(RANGE_ERROR));
    expect(mockUpdateActivityRow).not.toHaveBeenCalled();
  });

  it("still saves an activity the trip's new dates left outside when its date isn't changed", async () => {
    mockFindActivityById.mockResolvedValue(existingActivity({ date: new Date("2026-10-09T00:00:00.000Z") }));
    mockUpdateActivityRow.mockResolvedValue({ id: "a" });

    await updateActivityService(token, "trip-1", "a", {
      title: "Renamed",
      date: new Date("2026-10-09"),
    });

    expect(mockUpdateActivityRow).toHaveBeenCalledTimes(1);
  });

  it("rejects an end time before the stored start time", async () => {
    mockFindActivityById.mockResolvedValue(existingActivity({ startTime: "14:00", endTime: "15:00" }));

    await expect(updateActivityService(token, "trip-1", "a", { endTime: "13:00" })).rejects.toThrow(
      new ValidationError("End time can't be before the start time"),
    );
    expect(mockUpdateActivityRow).not.toHaveBeenCalled();
  });

  it("rejects a start time after the stored end time", async () => {
    mockFindActivityById.mockResolvedValue(existingActivity({ startTime: "09:00", endTime: "10:00" }));

    await expect(updateActivityService(token, "trip-1", "a", { startTime: "10:30" })).rejects.toThrow(
      ValidationError,
    );
  });

  it("allows a new start time once the stored end time is cleared in the same update", async () => {
    mockFindActivityById.mockResolvedValue(existingActivity({ startTime: "09:00", endTime: "10:00" }));
    mockUpdateActivityRow.mockResolvedValue({ id: "a" });

    await updateActivityService(token, "trip-1", "a", { startTime: "10:30", endTime: "" });

    expect(mockUpdateActivityRow).toHaveBeenCalledWith("a", { startTime: "10:30", endTime: null });
  });

  it("doesn't re-check stored times that aren't being changed", async () => {
    mockFindActivityById.mockResolvedValue(existingActivity({ startTime: "15:00", endTime: "09:00" }));
    mockUpdateActivityRow.mockResolvedValue({ id: "a" });

    await updateActivityService(token, "trip-1", "a", { done: true, title: "Renamed" });

    expect(mockUpdateActivityRow).toHaveBeenCalledTimes(1);
  });

  it("updates and clears the location", async () => {
    mockFindActivityById.mockResolvedValue(existingActivity());
    mockUpdateActivityRow.mockResolvedValue({ id: "a" });

    await updateActivityService(token, "trip-1", "a", { location: "Shibuya" });
    await updateActivityService(token, "trip-1", "a", { location: "" });

    expect(mockUpdateActivityRow.mock.calls[0][1]).toEqual({ location: "Shibuya" });
    expect(mockUpdateActivityRow.mock.calls[1][1]).toEqual({ location: null });
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
