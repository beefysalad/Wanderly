import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "@/lib/errors";

const mockGetInfo = vi.fn();
const mockDeleteFirebase = vi.fn();
vi.mock("./firebase", () => ({
  getFirebaseUserInfo: (...a: unknown[]) => mockGetInfo(...a),
  deleteFirebaseUser: (...a: unknown[]) => mockDeleteFirebase(...a),
}));

const mockList = vi.fn();
const mockCount = vi.fn();
const mockCountSince = vi.fn();
const mockFindFirebaseId = vi.fn();
const mockDeleteUser = vi.fn();
vi.mock("./repository", () => ({
  listUsersWithCreationCounts: (...a: unknown[]) => mockList(...a),
  countUsers: (...a: unknown[]) => mockCount(...a),
  countUsersCreatedSince: (...a: unknown[]) => mockCountSince(...a),
  findUserFirebaseId: (...a: unknown[]) => mockFindFirebaseId(...a),
  deleteUserAndCreatedGroups: (...a: unknown[]) => mockDeleteUser(...a),
}));

vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }));

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

describe("deleteUserService", () => {
  it("throws NotFoundError for an unknown user without deleting anything", async () => {
    mockFindFirebaseId.mockResolvedValue(null);

    await expect(deleteUserService("u1")).rejects.toThrow(NotFoundError);
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it("deletes from the database before touching Firebase", async () => {
    mockFindFirebaseId.mockResolvedValue({ firebaseId: "f1" });
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
    mockFindFirebaseId.mockResolvedValue({ firebaseId: "f1" });
    mockDeleteUser.mockRejectedValue(new Error("fk"));

    await expect(deleteUserService("u1")).rejects.toThrow("fk");
    expect(mockDeleteFirebase).not.toHaveBeenCalled();
  });

  it("succeeds silently when the Firebase account is already gone or there is none", async () => {
    mockFindFirebaseId.mockResolvedValue({ firebaseId: "f1" });
    mockDeleteFirebase.mockResolvedValue("not-found");
    expect(await deleteUserService("u1")).toEqual({ success: true });

    mockFindFirebaseId.mockResolvedValue({ firebaseId: "" });
    mockDeleteFirebase.mockClear();
    expect(await deleteUserService("u2")).toEqual({ success: true });
    expect(mockDeleteFirebase).not.toHaveBeenCalled();
  });

  it("reports a warning, not an error, when Firebase deletion fails after the DB delete", async () => {
    mockFindFirebaseId.mockResolvedValue({ firebaseId: "f1" });
    mockDeleteFirebase.mockRejectedValue(new Error("boom"));

    const result = await deleteUserService("u1");

    expect(result).toMatchObject({ success: true, warning: expect.stringContaining("Firebase") });
  });
});
