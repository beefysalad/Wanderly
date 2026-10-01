import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "@/src/lib/errors";

const mockGetInfo = vi.fn();
const mockDeleteFirebase = vi.fn();
vi.mock("./firebase", () => ({
  getFirebaseUserInfo: (...a: unknown[]) => mockGetInfo(...a),
  deleteFirebaseUser: (...a: unknown[]) => mockDeleteFirebase(...a),
}));

const mockList = vi.fn();
const mockCount = vi.fn();
const mockCountSince = vi.fn();
const mockFindForDeletion = vi.fn();
const mockDeleteUser = vi.fn();
vi.mock("./repository", () => ({
  listUsersWithCreationCounts: (...a: unknown[]) => mockList(...a),
  countUsers: (...a: unknown[]) => mockCount(...a),
  countUsersCreatedSince: (...a: unknown[]) => mockCountSince(...a),
  findUserForDeletion: (...a: unknown[]) => mockFindForDeletion(...a),
  deleteUserKeepingSharedData: (...a: unknown[]) => mockDeleteUser(...a),
}));

vi.mock("@/src/lib/logger", () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }));

const { deleteUserService, listUsersService } = await import("./services");

const dbUser = (id: string, firebaseId: string) => ({
  id,
  firebaseId,
  _count: { createdTrips: 2, createdGroups: 1 },
});

beforeEach(() => {
  vi.resetAllMocks();
  mockDeleteUser.mockResolvedValue(undefined);
  mockCount.mockResolvedValue(2);
  mockCountSince.mockResolvedValue(1);
});

describe("listUsersService", () => {
  it("merges Firebase sign-in info and creation stats into each user", async () => {
    mockList.mockResolvedValue([dbUser("u1", "f1"), dbUser("u2", "")]);
    mockGetInfo.mockResolvedValue({
      f1: { lastSignInTime: "L", creationTime: "C", emailVerified: true, disabled: false },
    });

    const result = await listUsersService();

    expect(mockGetInfo).toHaveBeenCalledWith(["f1"]);
    expect(result.stats).toEqual({ total: 2, newToday: 1 });
    expect(result.users[0]).toMatchObject({
      lastLoginAt: "L",
      authCreationTime: "C",
      emailVerified: true,
      stats: { trips: 2, groups: 1 },
    });
    expect(result.users[1]).toMatchObject({ lastLoginAt: null, emailVerified: false, disabled: false });
  });

  it("still returns users when Firebase lookup fails", async () => {
    mockList.mockResolvedValue([dbUser("u1", "f1")]);
    mockGetInfo.mockRejectedValue(new Error("firebase down"));

    const result = await listUsersService();

    expect(result.users).toHaveLength(1);
    expect(result.users[0].lastLoginAt).toBeNull();
  });

  it("counts new users from local midnight", async () => {
    mockList.mockResolvedValue([]);
    mockGetInfo.mockResolvedValue({});

    await listUsersService();

    const since: Date = mockCountSince.mock.calls[0][0];
    expect([since.getHours(), since.getMinutes(), since.getSeconds()]).toEqual([0, 0, 0]);
  });
});

const member = (userId: string, joinedDay: number) => ({ userId, joinedAt: new Date(2026, 0, joinedDay) });

const deletable = (overrides: Record<string, unknown> = {}) => ({
  firebaseId: "f1",
  name: "Ann Lee",
  email: "ann@x.com",
  createdGroups: [],
  ...overrides,
});

describe("deleteUserService", () => {
  it("throws NotFoundError for an unknown user without deleting anything", async () => {
    mockFindForDeletion.mockResolvedValue(null);

    await expect(deleteUserService("u1")).rejects.toThrow(NotFoundError);
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it("keeps the user's name on the rows other members still see", async () => {
    mockFindForDeletion.mockResolvedValue(deletable());

    await deleteUserService("u1");

    expect(mockDeleteUser).toHaveBeenCalledWith(expect.objectContaining({ userId: "u1", displayName: "Ann Lee" }));
  });

  it("falls back to the email's local part when the user has no name", async () => {
    mockFindForDeletion.mockResolvedValue(deletable({ name: "" }));

    await deleteUserService("u1");

    expect(mockDeleteUser).toHaveBeenCalledWith(expect.objectContaining({ displayName: "ann" }));
  });

  it("hands each owned group with other members to its longest-standing other member", async () => {
    mockFindForDeletion.mockResolvedValue(
      deletable({
        createdGroups: [
          { id: "g1", members: [member("u1", 1), member("bob", 3), member("cara", 2)] },
          { id: "g2", members: [member("dan", 5), member("u1", 1)] },
        ],
      }),
    );

    await deleteUserService("u1");

    expect(mockDeleteUser).toHaveBeenCalledWith(
      expect.objectContaining({
        groupTransfers: [
          { groupId: "g1", newOwnerId: "cara" },
          { groupId: "g2", newOwnerId: "dan" },
        ],
        groupIdsToDelete: [],
      }),
    );
  });

  it("deletes only the owned groups nobody else is in", async () => {
    mockFindForDeletion.mockResolvedValue(
      deletable({
        createdGroups: [
          { id: "solo", members: [member("u1", 1)] },
          { id: "shared", members: [member("u1", 1), member("bob", 2)] },
        ],
      }),
    );

    await deleteUserService("u1");

    expect(mockDeleteUser).toHaveBeenCalledWith(
      expect.objectContaining({
        groupTransfers: [{ groupId: "shared", newOwnerId: "bob" }],
        groupIdsToDelete: ["solo"],
      }),
    );
  });

  it("deletes from the database before touching Firebase", async () => {
    mockFindForDeletion.mockResolvedValue(deletable());
    const order: string[] = [];
    mockDeleteUser.mockImplementation(async () => void order.push("db"));
    mockDeleteFirebase.mockImplementation(async () => {
      order.push("firebase");
      return "deleted";
    });

    expect(await deleteUserService("u1")).toEqual({ success: true });
    expect(order).toEqual(["db", "firebase"]);
  });

  it("does not delete anything in Firebase when the DB deletion fails", async () => {
    mockFindForDeletion.mockResolvedValue(deletable());
    mockDeleteUser.mockRejectedValue(new Error("fk"));

    await expect(deleteUserService("u1")).rejects.toThrow("fk");
    expect(mockDeleteFirebase).not.toHaveBeenCalled();
  });

  it("succeeds silently when the Firebase account is already gone or there is none", async () => {
    mockFindForDeletion.mockResolvedValue(deletable());
    mockDeleteFirebase.mockResolvedValue("not-found");
    expect(await deleteUserService("u1")).toEqual({ success: true });

    mockFindForDeletion.mockResolvedValue(deletable({ firebaseId: "" }));
    mockDeleteFirebase.mockClear();
    expect(await deleteUserService("u2")).toEqual({ success: true });
    expect(mockDeleteFirebase).not.toHaveBeenCalled();
  });

  it("reports a warning, not an error, when Firebase deletion fails after the DB delete", async () => {
    mockFindForDeletion.mockResolvedValue(deletable());
    mockDeleteFirebase.mockRejectedValue(new Error("boom"));

    const result = await deleteUserService("u1");

    expect(result).toMatchObject({ success: true, warning: expect.stringContaining("Firebase") });
  });
});
