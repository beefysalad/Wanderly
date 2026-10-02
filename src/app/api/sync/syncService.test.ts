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

  it("returns an existing user without calling Firebase", async () => {
    const user = { id: "u1" };
    mockFind.mockResolvedValue(user);

    expect(await syncUserToDatabaseService(token)).toBe(user);
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("creates a new user from the Firebase profile", async () => {
    mockFind.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: "u2" });

    const result = await syncUserToDatabaseService(token);

    expect(mockCreate).toHaveBeenCalledWith("f1", {
      email: "a@x.com",
      name: "Al",
      imageUrl: "",
      disabled: false,
    });
    expect(result).toEqual({ id: "u2" });
  });

  it("refuses to attach a new Firebase account to an existing user through an unverified email", async () => {
    mockFind.mockResolvedValue(null);
    mockFindByEmail.mockResolvedValue({ id: "victim", firebaseId: "someone-else" });

    await expect(syncUserToDatabaseService(token)).rejects.toMatchObject({ status: 403 });
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
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
    mockUpdate.mockResolvedValue({ id: "u3" });

    const result = await syncUserToDatabaseService(token);

    expect(mockUpdate).toHaveBeenCalledWith("u3", "f1", expect.objectContaining({ email: "a@x.com" }));
    expect(result).toEqual({ id: "u3" });
  });

  it("rejects a Firebase account without an email address", async () => {
    mockFind.mockResolvedValue(null);
    mockGetUser.mockResolvedValue({ email: undefined, emailVerified: false, disabled: false });

    await expect(syncUserToDatabaseService(token)).rejects.toMatchObject({ status: 403 });
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns the row a concurrent first sign-in created instead of failing on the unique constraint", async () => {
    const createdByOtherRequest = { id: "u2" };
    mockFind.mockResolvedValueOnce(null).mockResolvedValueOnce(createdByOtherRequest);
    mockCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "test",
      }),
    );

    expect(await syncUserToDatabaseService(token)).toBe(createdByOtherRequest);
  });

  it("refuses to register a legacy sample-data member email, even when no row exists for it yet", async () => {
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

  it("refuses a legacy sample-data member email regardless of casing", async () => {
    mockFind.mockResolvedValue(null);
    mockGetUser.mockResolvedValue({
      email: "Eleven.Dummy@Example.com",
      emailVerified: false,
      displayName: "Eleven",
      photoURL: null,
      disabled: false,
    });

    await expect(syncUserToDatabaseService(token)).rejects.toMatchObject({ status: 403 });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("force sync refreshes the caller's own row, keeping its Firebase id", async () => {
    mockFind.mockResolvedValue({ id: "u1" });
    mockUpdate.mockResolvedValue({ id: "u1" });

    await syncUserToDatabaseService(token, true);

    expect(mockGetUser).toHaveBeenCalledWith("f1");
    expect(mockFindByEmail).not.toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledWith("u1", "f1", expect.objectContaining({ email: "a@x.com" }));
  });
});
