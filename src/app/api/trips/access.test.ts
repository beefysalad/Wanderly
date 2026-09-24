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
