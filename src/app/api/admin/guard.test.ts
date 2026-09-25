import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnauthorizedError } from "@/lib/errors";

const mockVerify = vi.fn();
vi.mock("@/lib/admin-auth", () => ({
  verifyAdminPassword: (...a: unknown[]) => mockVerify(...a),
}));

const { assertAdmin } = await import("./guard");

const req = (headers: Record<string, string> = {}) =>
  new NextRequest("http://localhost/api/admin/x", { headers });

beforeEach(() => vi.clearAllMocks());

describe("assertAdmin", () => {
  it("passes the x-admin-password header to the verifier and resolves when valid", async () => {
    mockVerify.mockResolvedValue(true);

    await expect(assertAdmin(req({ "x-admin-password": "pw" }))).resolves.toBeUndefined();
    expect(mockVerify).toHaveBeenCalledWith("pw");
  });

  it("throws UnauthorizedError when the password is wrong or missing", async () => {
    mockVerify.mockResolvedValue(false);

    await expect(assertAdmin(req())).rejects.toThrow(UnauthorizedError);
    expect(mockVerify).toHaveBeenCalledWith(null);
  });
});
