import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../errors";

const mockVerifyIdToken = vi.fn();

vi.mock("../firebase-admin", () => ({
  userAuth: {
    verifyIdToken: (...args: unknown[]) => mockVerifyIdToken(...args),
  },
}));

const mockVerifyGuestToken = vi.fn();
vi.mock("./guest-token", () => ({
  verifyGuestToken: (...a: unknown[]) => mockVerifyGuestToken(...a),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const { withAuth, withOptionalAuth } = await import("./with-auth");

function makeRequest(headers: Record<string, string> = {}) {
  const lower = Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]),
  );
  return {
    headers: { get: (key: string) => lower[key.toLowerCase()] ?? null },
    nextUrl: { pathname: "/api/test" },
  } as unknown as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("withAuth", () => {
  it("returns 401 without calling the handler when no Authorization header is present", async () => {
    const handler = vi.fn();
    const wrapped = withAuth(handler);

    const response = await wrapped(makeRequest());

    expect(response.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("calls a 2-arg handler with (req, authContext) for routes with no dynamic segments", async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: "user-1", email: "user@example.com" });
    const handler = vi.fn().mockResolvedValue(NextResponse.json(null));
    const wrapped = withAuth(handler);

    await wrapped(makeRequest({ Authorization: "Bearer token123" }));

    expect(handler).toHaveBeenCalledTimes(1);
    const [, authContext] = handler.mock.calls[0];
    expect(authContext.uid).toBe("user-1");
  });

  it("forwards the route context (params) through to a 3-arg handler", async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: "user-1" });
    const handler = vi.fn().mockResolvedValue(NextResponse.json(null));
    const wrapped = withAuth(handler);
    const routeContext = { params: Promise.resolve({ groupId: "g1" }) };

    await wrapped(makeRequest({ Authorization: "Bearer token123" }), routeContext);

    expect(handler).toHaveBeenCalledTimes(1);
    const [, , forwardedRouteContext] = handler.mock.calls[0];
    expect(forwardedRouteContext).toBe(routeContext);
    await expect(forwardedRouteContext.params).resolves.toEqual({ groupId: "g1" });
  });
});

describe("withOptionalAuth guests", () => {
  it("passes a verified guest token's group id and the route context to the handler", async () => {
    mockVerifyGuestToken.mockReturnValue({ groupId: "g1" });
    const handler = vi.fn().mockResolvedValue(NextResponse.json(null));
    const routeContext = { params: Promise.resolve({ groupId: "g1" }) };

    await withOptionalAuth(handler)(makeRequest({ "X-Guest-Token": "tok" }), routeContext);

    const [, ctx, forwarded] = handler.mock.calls[0];
    expect(ctx).toMatchObject({ isGuest: true, guestGroupId: "g1", uid: "guest" });
    expect(ctx).not.toHaveProperty("groupCode");
    expect(forwarded).toBe(routeContext);
  });

  it("returns 401 for an invalid or expired guest token", async () => {
    mockVerifyGuestToken.mockReturnValue(null);
    const handler = vi.fn();

    const response = await withOptionalAuth(handler)(makeRequest({ "X-Guest-Token": "bad" }));

    expect(response.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("no longer accepts a raw X-Guest-Code header", async () => {
    const handler = vi.fn();

    const response = await withOptionalAuth(handler)(makeRequest({ "X-Guest-Code": "ABC123" }));

    expect(response.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("prefers a valid Firebase user over a guest token", async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: "user-1" });
    const handler = vi.fn().mockResolvedValue(NextResponse.json(null));

    await withOptionalAuth(handler)(
      makeRequest({ Authorization: "Bearer t", "X-Guest-Token": "tok" }),
    );

    expect(handler.mock.calls[0][1].isGuest).toBe(false);
  });

  it("returns a generic 500 when a guest handler throws", async () => {
    mockVerifyGuestToken.mockReturnValue({ groupId: "g1" });

    const response = await withOptionalAuth(vi.fn().mockRejectedValue(new Error("boom")))(
      makeRequest({ "X-Guest-Token": "tok" }),
    );

    expect(response.status).toBe(500);
  });
});

describe("withAuth token verification", () => {
  it("asks Firebase to check for revoked tokens", async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: "user-1" });
    const wrapped = withAuth(vi.fn().mockResolvedValue(NextResponse.json(null)));

    await wrapped(makeRequest({ Authorization: "Bearer token123" }));

    expect(mockVerifyIdToken).toHaveBeenCalledWith("token123", true);
  });

  it("returns 401 'Token has been revoked' for a revoked or disabled account", async () => {
    mockVerifyIdToken.mockRejectedValue(
      Object.assign(new Error("The Firebase ID token has been revoked."), {
        code: "auth/id-token-revoked",
      }),
    );
    const handler = vi.fn();

    const response = await withAuth(handler)(makeRequest({ Authorization: "Bearer t" }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: "Token has been revoked" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns 401 'Invalid or expired token' for an expired token", async () => {
    mockVerifyIdToken.mockRejectedValue(
      Object.assign(new Error("expired"), { code: "auth/id-token-expired" }),
    );

    const response = await withAuth(vi.fn())(makeRequest({ Authorization: "Bearer t" }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: "Invalid or expired token" });
  });
});

describe("withAuth handler errors", () => {
  it("does not report an error thrown by the handler as a 401", async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: "user-1" });
    const wrapped = withAuth(vi.fn().mockRejectedValue(new AppError("teapot", 418)));

    const response = await wrapped(makeRequest({ Authorization: "Bearer t" }));

    expect(response.status).toBe(418);
    expect(await response.json()).toEqual({ error: "teapot" });
  });

  it("turns an unexpected handler error into a generic 500", async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: "user-1" });
    const wrapped = withAuth(vi.fn().mockRejectedValue(new Error("db exploded")));

    const response = await wrapped(makeRequest({ Authorization: "Bearer t" }));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal server error" });
  });
});
