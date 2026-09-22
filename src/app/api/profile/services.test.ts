import type { DecodedIdToken } from "firebase-admin/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError, UnauthorizedError, ValidationError } from "@/lib/errors";

const mockUpdateUser = vi.fn();
const mockGetUser = vi.fn();

vi.mock("@/lib/firebase-admin", () => ({
  userAuth: {
    updateUser: (...args: unknown[]) => mockUpdateUser(...args),
    getUser: (...args: unknown[]) => mockGetUser(...args),
  },
}));

const mockSyncUserToDatabaseService = vi.fn();
vi.mock("../sync/syncService", () => ({
  syncUserToDatabaseService: (...args: unknown[]) =>
    mockSyncUserToDatabaseService(...args),
}));

const mockUpdateUserMetadataByFirebaseId = vi.fn();
vi.mock("./repository", () => ({
  updateUserMetadataByFirebaseId: (...args: unknown[]) =>
    mockUpdateUserMetadataByFirebaseId(...args),
}));

const { getProfileService, updatePasswordService, updateProfileService } =
  await import("./services");

const decodedToken = {
  uid: "user-1",
  email: "user@example.com",
} as DecodedIdToken;

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_FIREBASE_API_KEY", "test-key");
  vi.stubGlobal("fetch", vi.fn());
});

describe("getProfileService", () => {
  it("syncs without forcing", async () => {
    mockSyncUserToDatabaseService.mockResolvedValue({ id: "user-1" });

    const result = await getProfileService(decodedToken);

    expect(mockSyncUserToDatabaseService).toHaveBeenCalledWith(decodedToken, false);
    expect(result).toEqual({ id: "user-1" });
  });
});

describe("updateProfileService", () => {
  it("updates Firebase Auth fields when name/photoURL are provided", async () => {
    mockSyncUserToDatabaseService.mockResolvedValue({ id: "user-1", name: "New Name" });

    await updateProfileService(decodedToken, { name: "New Name" });

    expect(mockUpdateUser).toHaveBeenCalledWith("user-1", { displayName: "New Name" });
    expect(mockUpdateUserMetadataByFirebaseId).not.toHaveBeenCalled();
    expect(mockSyncUserToDatabaseService).toHaveBeenCalledWith(decodedToken, true);
  });

  it("updates Prisma metadata when bio/travelStyle are provided", async () => {
    mockSyncUserToDatabaseService.mockResolvedValue({ id: "user-1" });

    await updateProfileService(decodedToken, { bio: "Hello", travelStyle: "Adventure" });

    expect(mockUpdateUser).not.toHaveBeenCalled();
    expect(mockUpdateUserMetadataByFirebaseId).toHaveBeenCalledWith("user-1", {
      bio: "Hello",
      travelStyle: "Adventure",
    });
  });

  it("updates both Firebase and Prisma fields when both are provided", async () => {
    mockSyncUserToDatabaseService.mockResolvedValue({ id: "user-1" });

    await updateProfileService(decodedToken, { name: "New Name", bio: "Hello" });

    expect(mockUpdateUser).toHaveBeenCalledWith("user-1", { displayName: "New Name" });
    expect(mockUpdateUserMetadataByFirebaseId).toHaveBeenCalledWith("user-1", {
      bio: "Hello",
    });
  });
});

describe("updatePasswordService", () => {
  it("throws ValidationError when the token has no email", async () => {
    await expect(
      updatePasswordService({ uid: "user-1" } as DecodedIdToken, {
        currentPassword: "x",
        newPassword: "newpassword123",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("throws UnauthorizedError when the current password is wrong", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: "INVALID_PASSWORD" } }),
    });

    await expect(
      updatePasswordService(decodedToken, {
        currentPassword: "wrong",
        newPassword: "newpassword123",
      }),
    ).rejects.toThrow(UnauthorizedError);

    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("throws NotFoundError when the Firebase user can't be found after verification", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    mockGetUser.mockResolvedValue(null);

    await expect(
      updatePasswordService(decodedToken, {
        currentPassword: "correct",
        newPassword: "newpassword123",
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("updates the password when verification succeeds", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    mockGetUser.mockResolvedValue({ uid: "user-1" });

    await updatePasswordService(decodedToken, {
      currentPassword: "correct",
      newPassword: "newpassword123",
    });

    expect(mockUpdateUser).toHaveBeenCalledWith("user-1", { password: "newpassword123" });
  });
});
