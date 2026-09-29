import { Prisma } from "@prisma/client";
import type { DecodedIdToken } from "firebase-admin/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetUser = vi.hoisted(() => vi.fn());
const firebase = vi.hoisted(() => ({ userAuth: { getUser: undefined as unknown } as { getUser: unknown } | null }));
vi.mock("@/src/lib/firebase-admin", () => ({
  get userAuth() {
    return firebase.userAuth;
  },
}));

const mockFind = vi.fn();
const mockFindByEmail = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
vi.mock("./repository", () => ({
  findUserByFirebaseId: (...a: unknown[]) => mockFind(...a),
  findUserByEmail: (...a: unknown[]) => mockFindByEmail(...a),
  createUserFromFirebase: (...a: unknown[]) => mockCreate(...a),
  updateUserFromFirebase: (...a: unknown[]) => mockUpdate(...a),
}));

const mockSeed = vi.fn();
vi.mock("./testDataService", () => ({ seedTestData: (...a: unknown[]) => mockSeed(...a) }));
vi.mock("@/src/lib/logger", () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }));

const { syncUserToDatabaseService } = await import("./syncService");

const token = { uid: "f1" } as DecodedIdToken;

beforeEach(() => {
  vi.resetAllMocks();
  firebase.userAuth = { getUser: mockGetUser };
  mockGetUser.mockResolvedValue({
    email: "a@x.com",
    emailVerified: false,
    displayName: "Al",
    photoURL: null,
    disabled: false,
  });
  mockFindByEmail.mockResolvedValue(null);
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
    mockCreate.mockResolvedValue({ id: "u2", hasSeededTestData: false });

    const result = await syncUserToDatabaseService(token);

    expect(mockCreate).toHaveBeenCalledWith("f1", {
      email: "a@x.com",
      name: "Al",
      imageUrl: "",
      disabled: false,
    });
    expect(mockSeed).toHaveBeenCalledWith("u2");
    expect(result).toEqual({ id: "u2", hasSeededTestData: false });
  });

  it("refuses to attach a new Firebase account to an existing user through an unverified email", async () => {
    mockFind.mockResolvedValue(null);
    mockFindByEmail.mockResolvedValue({ id: "victim", firebaseId: "someone-else" });

    await expect(syncUserToDatabaseService(token)).rejects.toMatchObject({ status: 403 });
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockSeed).not.toHaveBeenCalled();
  });

  it("links an existing user to a new Firebase account when the email is verified", async () => {
    mockFind.mockResolvedValue(null);
    mockFindByEmail.mockResolvedValue({ id: "u3", firebaseId: "old-uid" });
    mockGetUser.mockResolvedValue({
      email: "a@x.com",
      emailVerified: true,
      displayName: "Al",
      photoURL: null,
      disabled: false,
    });
    mockUpdate.mockResolvedValue({ id: "u3", hasSeededTestData: true });

    const result = await syncUserToDatabaseService(token);

    expect(mockUpdate).toHaveBeenCalledWith("u3", "f1", expect.objectContaining({ email: "a@x.com" }));
    expect(result).toEqual({ id: "u3", hasSeededTestData: true });
  });

  it("rejects a Firebase account without an email address", async () => {
    mockFind.mockResolvedValue(null);
    mockGetUser.mockResolvedValue({ email: undefined, emailVerified: false, disabled: false });

    await expect(syncUserToDatabaseService(token)).rejects.toMatchObject({ status: 403 });
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns the row a concurrent first sign-in created instead of failing on the unique constraint", async () => {
    const createdByOtherRequest = { id: "u2", hasSeededTestData: true };
    mockFind.mockResolvedValueOnce(null).mockResolvedValueOnce(createdByOtherRequest);
    mockCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "test",
      }),
    );

    expect(await syncUserToDatabaseService(token)).toBe(createdByOtherRequest);
  });

  it("refuses to register a sample-data member email, even when no row exists for it yet", async () => {
    mockFind.mockResolvedValue(null);
    mockGetUser.mockResolvedValue({
      email: "steve.dummy@example.com",
      emailVerified: false,
      displayName: "Steve",
      photoURL: null,
      disabled: false,
    });

    await expect(syncUserToDatabaseService(token)).rejects.toMatchObject({ status: 403 });
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("force sync refreshes the caller's own row, keeping its Firebase id", async () => {
    mockFind.mockResolvedValue({ id: "u1", hasSeededTestData: true });
    mockUpdate.mockResolvedValue({ id: "u1", hasSeededTestData: true });

    await syncUserToDatabaseService(token, true);

    expect(mockGetUser).toHaveBeenCalledWith("f1");
    expect(mockFindByEmail).not.toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledWith("u1", "f1", expect.objectContaining({ email: "a@x.com" }));
    expect(mockSeed).not.toHaveBeenCalled();
  });
});
