import type { DecodedIdToken } from "firebase-admin/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetUser = vi.hoisted(() => vi.fn());
const firebase = vi.hoisted(() => ({ userAuth: { getUser: undefined as unknown } as { getUser: unknown } | null }));
vi.mock("@/lib/firebase-admin", () => ({
  get userAuth() {
    return firebase.userAuth;
  },
}));

const mockFind = vi.fn();
const mockUpsert = vi.fn();
vi.mock("./repository", () => ({
  findUserByFirebaseId: (...a: unknown[]) => mockFind(...a),
  upsertUserFromFirebase: (...a: unknown[]) => mockUpsert(...a),
}));

const mockSeed = vi.fn();
vi.mock("./testDataService", () => ({ seedTestData: (...a: unknown[]) => mockSeed(...a) }));
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }));

const { syncUserToDatabaseService } = await import("./syncService");

const token = { uid: "f1" } as DecodedIdToken;

beforeEach(() => {
  vi.resetAllMocks();
  firebase.userAuth = { getUser: mockGetUser };
  mockGetUser.mockResolvedValue({
    email: "a@x.com",
    displayName: "Al",
    photoURL: null,
    disabled: false,
  });
});

describe("syncUserToDatabaseService", () => {
  it("throws when Firebase admin isn't initialised", async () => {
    firebase.userAuth = null;

    await expect(syncUserToDatabaseService(token)).rejects.toThrow("Firebase admin not initialized");
  });

  it("returns an existing seeded user without calling Firebase", async () => {
    const user = { id: "u1", hasSeededTestData: true };
    mockFind.mockResolvedValue(user);

    expect(await syncUserToDatabaseService(token)).toBe(user);
    expect(mockGetUser).not.toHaveBeenCalled();
    expect(mockSeed).not.toHaveBeenCalled();
  });

  it("seeds an existing user who was never seeded", async () => {
    mockFind.mockResolvedValue({ id: "u1", hasSeededTestData: false });

    await syncUserToDatabaseService(token);

    expect(mockSeed).toHaveBeenCalledWith("u1");
  });

  it("creates a new user from the Firebase profile, then seeds them", async () => {
    mockFind.mockResolvedValue(null);
    mockUpsert.mockResolvedValue({ id: "u2", hasSeededTestData: false });

    const result = await syncUserToDatabaseService(token);

    expect(mockUpsert).toHaveBeenCalledWith("f1", {
      email: "a@x.com",
      name: "Al",
      imageUrl: "",
      disabled: false,
    });
    expect(mockSeed).toHaveBeenCalledWith("u2");
    expect(result).toEqual({ id: "u2", hasSeededTestData: false });
  });

  it("force sync refreshes an existing user from Firebase", async () => {
    mockFind.mockResolvedValue({ id: "u1", hasSeededTestData: true });
    mockUpsert.mockResolvedValue({ id: "u1", hasSeededTestData: true });

    await syncUserToDatabaseService(token, true);

    expect(mockGetUser).toHaveBeenCalledWith("f1");
    expect(mockUpsert).toHaveBeenCalled();
    expect(mockSeed).not.toHaveBeenCalled();
  });
});
