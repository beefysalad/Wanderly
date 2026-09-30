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

const mockFindUserIdByFirebaseId = vi.fn();
vi.mock("../sync/repository", () => ({
  findUserIdByFirebaseId: (...a: unknown[]) => mockFindUserIdByFirebaseId(...a),
}));

const { verifyGuestTripAccess, verifyTripAccess, verifyTripAccessWithProfile } = await import(
  "./access"
);

const token = { uid: "firebase-1" } as DecodedIdToken;
const user = { id: "user-1", name: "Alice", email: "alice@example.com" };

beforeEach(() => {
  vi.clearAllMocks();
  mockSyncUserToDatabaseService.mockResolvedValue(user);
  mockFindUserIdByFirebaseId.mockResolvedValue({ id: "user-1" });
});

describe("verifyTripAccess", () => {
  it("does not run the full user sync when an id-only lookup finds the caller", async () => {
    mockFindTripAccessInfo.mockResolvedValue({ id: "trip-1", groupId: "group-1" });
    mockFindGroupMembership.mockResolvedValue({ groupId: "group-1", userId: "user-1" });

    await verifyTripAccess(token, "trip-1");

    expect(mockFindUserIdByFirebaseId).toHaveBeenCalledWith("firebase-1");
    expect(mockSyncUserToDatabaseService).not.toHaveBeenCalled();
  });

  it("falls back to the full sync when no user row exists yet for this Firebase uid", async () => {
    mockFindUserIdByFirebaseId.mockResolvedValue(null);
    mockFindTripAccessInfo.mockResolvedValue({ id: "trip-1", groupId: "group-1" });
    mockFindGroupMembership.mockResolvedValue({ groupId: "group-1", userId: "user-1" });

    await verifyTripAccess(token, "trip-1");

    expect(mockSyncUserToDatabaseService).toHaveBeenCalledWith(token);
  });

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

  it("returns the trip and a lean { id } user when the caller is a member", async () => {
    mockFindTripAccessInfo.mockResolvedValue({ id: "trip-1", groupId: "group-1" });
    mockFindGroupMembership.mockResolvedValue({ groupId: "group-1", userId: "user-1" });

    const result = await verifyTripAccess(token, "trip-1");

    expect(result).toEqual({ trip: { id: "trip-1", groupId: "group-1" }, user: { id: "user-1" } });
  });
});

describe("verifyTripAccessWithProfile", () => {
  it("always runs the full user sync (name/email are needed for notification text)", async () => {
    mockFindTripAccessInfo.mockResolvedValue({ id: "trip-1", groupId: "group-1" });
    mockFindGroupMembership.mockResolvedValue({ groupId: "group-1", userId: "user-1" });

    await verifyTripAccessWithProfile(token, "trip-1");

    expect(mockSyncUserToDatabaseService).toHaveBeenCalledWith(token);
    expect(mockFindUserIdByFirebaseId).not.toHaveBeenCalled();
  });

  it("throws NotFoundError when the trip doesn't exist, without checking membership", async () => {
    mockFindTripAccessInfo.mockResolvedValue(null);

    await expect(verifyTripAccessWithProfile(token, "trip-1")).rejects.toThrow(NotFoundError);
    expect(mockFindGroupMembership).not.toHaveBeenCalled();
  });

  it("throws ForbiddenError when the user isn't a member of the trip's group", async () => {
    mockFindTripAccessInfo.mockResolvedValue({ id: "trip-1", groupId: "group-1" });
    mockFindGroupMembership.mockResolvedValue(null);

    await expect(verifyTripAccessWithProfile(token, "trip-1")).rejects.toThrow(ForbiddenError);
    expect(mockFindGroupMembership).toHaveBeenCalledWith("group-1", "user-1");
  });

  it("returns the trip and the full user profile when the caller is a member", async () => {
    mockFindTripAccessInfo.mockResolvedValue({ id: "trip-1", groupId: "group-1" });
    mockFindGroupMembership.mockResolvedValue({ groupId: "group-1", userId: "user-1" });

    const result = await verifyTripAccessWithProfile(token, "trip-1");

    expect(result).toEqual({ trip: { id: "trip-1", groupId: "group-1" }, user });
  });
});

describe("verifyGuestTripAccess", () => {
  it("throws NotFoundError when the trip doesn't exist", async () => {
    mockFindTripAccessInfo.mockResolvedValue(null);

    await expect(verifyGuestTripAccess("group-1", "trip-1")).rejects.toThrow(NotFoundError);
  });

  it("throws ForbiddenError when the guest's token is for a different group", async () => {
    mockFindTripAccessInfo.mockResolvedValue({ id: "trip-1", groupId: "group-2", name: "T" });

    await expect(verifyGuestTripAccess("group-1", "trip-1")).rejects.toThrow(ForbiddenError);
  });

  it("returns the trip when the token's group owns it", async () => {
    mockFindTripAccessInfo.mockResolvedValue({ id: "trip-1", groupId: "group-1", name: "T" });

    expect(await verifyGuestTripAccess("group-1", "trip-1")).toEqual({
      trip: { id: "trip-1", groupId: "group-1" },
    });
  });
});
