import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUpsert = vi.fn();
vi.mock("./repository", () => ({ upsertUserProfile: (...a: unknown[]) => mockUpsert(...a) }));
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }));

const { updateUserProfileService } = await import("./services");

beforeEach(() => {
  vi.clearAllMocks();
  mockUpsert.mockResolvedValue({ id: "u1" });
});

describe("updateUserProfileService", () => {
  it("writes only the fields that were sent", async () => {
    await updateUserProfileService({ uid: "f1", email: "a@x.com" }, { bio: "hi", name: undefined });

    expect(mockUpsert.mock.calls[0][1]).toEqual({ bio: "hi" });
  });

  it("saves the onboarding travelStyle", async () => {
    await updateUserProfileService({ uid: "f1", email: "a@x.com" }, { travelStyle: "Foodie, City" });

    expect(mockUpsert.mock.calls.at(-1)?.[1]).toEqual({ travelStyle: "Foodie, City" });
  });

  it("supplies defaults for creating a user who hasn't synced yet", async () => {
    await updateUserProfileService({ uid: "f1", email: "alice@x.com" }, {});

    expect(mockUpsert).toHaveBeenCalledWith("f1", {}, {
      firebaseId: "f1",
      email: "alice@x.com",
      name: "alice",
      lastSeenWhatsNew: "",
    });
  });

  it("prefers the token's display name, then falls back to 'User' with no email", async () => {
    await updateUserProfileService({ uid: "f1", email: "a@x.com", tokenName: "Alice A" }, { lastSeenWhatsNew: "v2" });
    await updateUserProfileService({ uid: "f2" }, {});

    expect(mockUpsert.mock.calls[0][2]).toMatchObject({ name: "Alice A", lastSeenWhatsNew: "v2" });
    expect(mockUpsert.mock.calls[1][2]).toMatchObject({ email: "", name: "User" });
  });
});
