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
