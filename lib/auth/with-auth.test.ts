import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockVerifyIdToken = vi.fn();

vi.mock("../firebase-admin", () => ({
  userAuth: {
    verifyIdToken: (...args: unknown[]) => mockVerifyIdToken(...args),
  },
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

describe("withOptionalAuth", () => {
  it("forwards the route context through to the handler alongside guest context", async () => {
    const handler = vi.fn().mockResolvedValue(NextResponse.json(null));
    const wrapped = withOptionalAuth(handler);
    const routeContext = { params: Promise.resolve({ groupId: "g1" }) };

    await wrapped(
      makeRequest({ "X-Guest-Code": "ABC123" }),
      routeContext,
    );

    expect(handler).toHaveBeenCalledTimes(1);
    const [, guestContext, forwardedRouteContext] = handler.mock.calls[0];
    expect(guestContext.isGuest).toBe(true);
    expect(guestContext.groupCode).toBe("ABC123");
    expect(forwardedRouteContext).toBe(routeContext);
  });
});
