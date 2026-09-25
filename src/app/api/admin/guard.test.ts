import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnauthorizedError } from "@/lib/errors";

const mockVerifyIdToken = vi.fn();
vi.mock("@/lib/firebase-admin", () => ({
  userAuth: { verifyIdToken: (...a: unknown[]) => mockVerifyIdToken(...a) },
}));

const mockWarn = vi.fn();
vi.mock("@/lib/logger", () => ({
  logger: { warn: (...a: unknown[]) => mockWarn(...a), info: vi.fn(), error: vi.fn() },
}));

const { assertAdmin } = await import("./guard");

const req = (headers: Record<string, string> = {}) =>
  new NextRequest("http://localhost/api/admin/x", { headers });

beforeEach(() => {
  vi.resetAllMocks();
  process.env.ADMIN_EMAILS = "boss@x.com";
});

describe("assertAdmin", () => {
  it("accepts an allow-listed verified admin and returns their lower-cased email", async () => {
    mockVerifyIdToken.mockResolvedValue({ email: "Boss@x.com", email_verified: true });

    await expect(assertAdmin(req({ Authorization: "Bearer tok" }))).resolves.toEqual({
      adminEmail: "boss@x.com",
    });
    expect(mockVerifyIdToken).toHaveBeenCalledWith("tok", true);
  });

  it("rejects a signed-in user who is not on the allowlist", async () => {
    mockVerifyIdToken.mockResolvedValue({ email: "user@x.com", email_verified: true });

    await expect(assertAdmin(req({ Authorization: "Bearer tok" }))).rejects.toThrow(
      UnauthorizedError,
    );
  });

  it("rejects an unverified allow-listed email", async () => {
    mockVerifyIdToken.mockResolvedValue({ email: "boss@x.com", email_verified: false });

    await expect(assertAdmin(req({ Authorization: "Bearer tok" }))).rejects.toThrow(
      UnauthorizedError,
    );
  });

  it("rejects an invalid, expired or revoked token", async () => {
    mockVerifyIdToken.mockRejectedValue(new Error("bad token"));

    await expect(assertAdmin(req({ Authorization: "Bearer tok" }))).rejects.toThrow(
      UnauthorizedError,
    );
  });

  it("rejects a request with no credentials, and the old password header no longer works", async () => {
    await expect(assertAdmin(req())).rejects.toThrow(UnauthorizedError);
    await expect(assertAdmin(req({ "x-admin-password": "anything" }))).rejects.toThrow(
      UnauthorizedError,
    );
    expect(mockVerifyIdToken).not.toHaveBeenCalled();
  });

  it("logs why a signed-in user was refused (unverified email vs. not on the list)", async () => {
    mockVerifyIdToken.mockResolvedValueOnce({ email: "boss@x.com", email_verified: false });
    await assertAdmin(req({ Authorization: "Bearer tok" })).catch(() => undefined);
    mockVerifyIdToken.mockResolvedValueOnce({ email: "user@x.com", email_verified: true });
    await assertAdmin(req({ Authorization: "Bearer tok" })).catch(() => undefined);

    const reasons = mockWarn.mock.calls.map((c) => c[1].reason);
    expect(reasons).toEqual(["email-not-verified", "email-not-on-ADMIN_EMAILS"]);
  });
});
