import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPost = vi.fn();
vi.mock("axios", () => ({ default: { post: (...a: unknown[]) => mockPost(...a) } }));

class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

const storage = new MemoryStorage();

// vitest's default "node" environment has no window/localStorage; the module falls back to
// no-ops without them, so a browser-like global is stubbed to exercise the real code paths.
beforeEach(() => {
  vi.clearAllMocks();
  storage.clear();
  vi.stubGlobal("window", {});
  vi.stubGlobal("localStorage", storage);
});

const {
  clearGuestSession,
  getGuestSession,
  isGuest,
  refreshGuestToken,
  setGuestSession,
} = await import("./guest-session");

describe("setGuestSession / getGuestSession", () => {
  it("stores and reads back a session", () => {
    setGuestSession("ABC123", "Gary", "g1", "token-1");

    expect(getGuestSession()).toEqual({
      groupCode: "ABC123",
      guestName: "Gary",
      groupId: "g1",
      guestToken: "token-1",
    });
  });

  it("returns null when nothing is stored", () => {
    expect(getGuestSession()).toBeNull();
  });

  it("returns null instead of throwing on corrupted JSON", () => {
    storage.setItem("wanderly_guest_session", "{not json");

    expect(getGuestSession()).toBeNull();
  });
});

describe("clearGuestSession / isGuest", () => {
  it("reports isGuest true only while a session is stored, false after clearing", () => {
    expect(isGuest()).toBe(false);

    setGuestSession("ABC123", "Gary", "g1");
    expect(isGuest()).toBe(true);

    clearGuestSession();
    expect(isGuest()).toBe(false);
  });
});

describe("refreshGuestToken", () => {
  it("returns null without calling the API when there is no session", async () => {
    expect(await refreshGuestToken()).toBeNull();
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("exchanges the stored code for a fresh token and persists it", async () => {
    setGuestSession("ABC123", "Gary", "g1");
    mockPost.mockResolvedValue({ data: { guestToken: "fresh-token" } });

    const token = await refreshGuestToken();

    expect(mockPost).toHaveBeenCalledWith("/api/groups/validate-code", { code: "ABC123" });
    expect(token).toBe("fresh-token");
    expect(getGuestSession()?.guestToken).toBe("fresh-token");
  });

  it("returns null when the server responds without a token", async () => {
    setGuestSession("ABC123", "Gary", "g1");
    mockPost.mockResolvedValue({ data: {} });

    expect(await refreshGuestToken()).toBeNull();
  });

  it("returns null instead of throwing when the request fails", async () => {
    setGuestSession("ABC123", "Gary", "g1");
    mockPost.mockRejectedValue(new Error("network down"));

    expect(await refreshGuestToken()).toBeNull();
  });
});
