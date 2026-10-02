import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFindGroups = vi.fn();
const mockFindTrips = vi.fn();
const mockFindDummyUsers = vi.fn();
const mockDeleteGroups = vi.fn();
const mockDeleteTrips = vi.fn();
vi.mock("@/src/lib/prisma", () => ({
  default: {
    group: { findMany: (...a: unknown[]) => mockFindGroups(...a), deleteMany: (...a: unknown[]) => mockDeleteGroups(...a) },
    trip: { findMany: (...a: unknown[]) => mockFindTrips(...a), deleteMany: (...a: unknown[]) => mockDeleteTrips(...a) },
    user: { findMany: (...a: unknown[]) => mockFindDummyUsers(...a) },
  },
}));

const mockFindUserForDeletion = vi.fn();
const mockDeleteUserKeepingSharedData = vi.fn();
vi.mock("@/src/app/api/admin/users/repository", () => ({
  findUserForDeletion: (...a: unknown[]) => mockFindUserForDeletion(...a),
  deleteUserKeepingSharedData: (...a: unknown[]) => mockDeleteUserKeepingSharedData(...a),
}));

const { runCleanup } = await import("./legacyCleanupService");

beforeEach(() => {
  vi.resetAllMocks();
  mockFindGroups.mockResolvedValue([{ id: "g1", name: "Singapore Adventure 2024 (sample)" }]);
  mockFindTrips.mockResolvedValue([]);
  mockFindDummyUsers.mockResolvedValue([
    { id: "u-eleven", email: "eleven.dummy@example.com", name: "Eleven" },
  ]);
});

describe("runCleanup", () => {
  it("in dry-run mode, reports counts and deletes nothing", async () => {
    const result = await runCleanup(false);

    expect(result).toEqual({ groups: 1, trips: 0, dummyUsers: 1, executed: false });
    expect(mockDeleteGroups).not.toHaveBeenCalled();
    expect(mockDeleteTrips).not.toHaveBeenCalled();
    expect(mockDeleteUserKeepingSharedData).not.toHaveBeenCalled();
  });

  it("with execute, deletes the found sample groups/trips and dummy users", async () => {
    mockFindUserForDeletion.mockResolvedValue({ createdGroups: [] });

    const result = await runCleanup(true);

    expect(mockDeleteGroups).toHaveBeenCalledWith({ where: { id: { in: ["g1"] } } });
    expect(mockDeleteTrips).not.toHaveBeenCalled();
    expect(mockDeleteUserKeepingSharedData).toHaveBeenCalledWith({
      userId: "u-eleven",
      displayName: "Eleven",
      groupTransfers: [],
      groupIdsToDelete: [],
    });
    expect(result).toEqual({ groups: 1, trips: 0, dummyUsers: 1, executed: true });
  });

  it("refuses to delete a legacy dummy user that unexpectedly owns a group", async () => {
    mockFindUserForDeletion.mockResolvedValue({ createdGroups: [{ id: "owned-group", members: [] }] });

    await expect(runCleanup(true)).rejects.toThrow(/owns a group/);
    expect(mockDeleteUserKeepingSharedData).not.toHaveBeenCalled();
  });
});
