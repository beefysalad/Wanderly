import { beforeEach, describe, expect, it, vi } from "vitest";

// The axios instance must be both an object (interceptors.*.use) and callable
// (the retry path does `return api(original)`).
const mockApi = Object.assign(vi.fn(), {
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
});

vi.mock("axios", () => ({ default: { create: () => mockApi } }));

const mockGetToken = vi.fn();
vi.mock("./helper", () => ({ getToken: (...a: unknown[]) => mockGetToken(...a) }));

const mockGetGuestSession = vi.fn();
const mockRefreshGuestToken = vi.fn();
vi.mock("./guest-session", () => ({
  getGuestSession: (...a: unknown[]) => mockGetGuestSession(...a),
  refreshGuestToken: (...a: unknown[]) => mockRefreshGuestToken(...a),
}));

await import("./axios");

const [requestFulfilled] = mockApi.interceptors.request.use.mock.calls[0];
const [responseFulfilled, responseRejected] = mockApi.interceptors.response.use.mock.calls[0];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("request interceptor", () => {
  it("attaches the Firebase bearer token when signed in", async () => {
    mockGetToken.mockResolvedValue("firebase-token");

    const config = await requestFulfilled({ headers: {} });

    expect(config.headers.Authorization).toBe("Bearer firebase-token");
    expect(mockGetGuestSession).not.toHaveBeenCalled();
  });

  it("attaches the cached guest token when signed out", async () => {
    mockGetToken.mockRejectedValue(new Error("not signed in"));
    mockGetGuestSession.mockReturnValue({ guestToken: "guest-1" });

    const config = await requestFulfilled({ headers: {} });

    expect(config.headers["X-Guest-Token"]).toBe("guest-1");
    expect(mockRefreshGuestToken).not.toHaveBeenCalled();
  });

  it("fetches a fresh guest token when the session has none cached yet", async () => {
    mockGetToken.mockRejectedValue(new Error("not signed in"));
    mockGetGuestSession.mockReturnValue({ guestToken: undefined });
    mockRefreshGuestToken.mockResolvedValue("fresh-guest-token");

    const config = await requestFulfilled({ headers: {} });

    expect(config.headers["X-Guest-Token"]).toBe("fresh-guest-token");
  });

  it("adds no auth header when neither signed in nor a guest (public routes)", async () => {
    mockGetToken.mockRejectedValue(new Error("not signed in"));
    mockGetGuestSession.mockReturnValue(null);

    const config = await requestFulfilled({ headers: {} });

    expect(config.headers.Authorization).toBeUndefined();
    expect(config.headers["X-Guest-Token"]).toBeUndefined();
  });
});

describe("response interceptor", () => {
  it("passes a successful response through unchanged", () => {
    const response = { status: 200, data: { ok: true } };

    expect(responseFulfilled(response)).toBe(response);
  });

  it("retries a guest request once on 401, with a refreshed token", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const original: any = { headers: { "X-Guest-Token": "stale" } };
    const error = { response: { status: 401 }, config: original };
    mockRefreshGuestToken.mockResolvedValue("fresh-token");
    mockApi.mockResolvedValue({ status: 200, data: "ok" });

    const result = await responseRejected(error);

    expect(original._guestRetried).toBe(true);
    expect(original.headers["X-Guest-Token"]).toBe("fresh-token");
    expect(mockApi).toHaveBeenCalledWith(original);
    expect(result).toEqual({ status: 200, data: "ok" });
  });

  it("does not retry a second time (the _guestRetried guard)", async () => {
    const original = { headers: { "X-Guest-Token": "stale" }, _guestRetried: true };
    const error = { response: { status: 401 }, config: original };

    await expect(responseRejected(error)).rejects.toBe(error);
    expect(mockRefreshGuestToken).not.toHaveBeenCalled();
  });

  it("does not treat a non-guest request's 401 as retryable", async () => {
    const error = { response: { status: 401 }, config: { headers: {} } };

    await expect(responseRejected(error)).rejects.toBe(error);
    expect(mockRefreshGuestToken).not.toHaveBeenCalled();
  });

  it("rejects with the original error when the refresh itself fails to produce a token", async () => {
    const original = { headers: { "X-Guest-Token": "stale" } };
    const error = { response: { status: 401 }, config: original };
    mockRefreshGuestToken.mockResolvedValue(null);

    await expect(responseRejected(error)).rejects.toBe(error);
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("passes through non-401 errors unchanged", async () => {
    const error = { response: { status: 500 }, config: { headers: {} } };

    await expect(responseRejected(error)).rejects.toBe(error);
    expect(mockRefreshGuestToken).not.toHaveBeenCalled();
  });
});
