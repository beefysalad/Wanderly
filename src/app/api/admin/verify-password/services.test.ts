import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnauthorizedError } from "@/lib/errors";

const mockVerify = vi.fn();
vi.mock("@/lib/admin-auth", () => ({
  verifyAdminPassword: (...a: unknown[]) => mockVerify(...a),
}));
const mockWarn = vi.fn();
vi.mock("@/lib/logger", () => ({
  logger: { warn: (...a: unknown[]) => mockWarn(...a), info: vi.fn(), error: vi.fn() },
}));

const { verifyAdminPasswordService } = await import("./services");

beforeEach(() => vi.clearAllMocks());

describe("verifyAdminPasswordService", () => {
  it("resolves for a valid password", async () => {
    mockVerify.mockResolvedValue(true);

    await expect(verifyAdminPasswordService("pw")).resolves.toBeUndefined();
    expect(mockWarn).not.toHaveBeenCalled();
  });

  it("logs and throws UnauthorizedError for an invalid one, without logging the password", async () => {
    mockVerify.mockResolvedValue(false);

    await expect(verifyAdminPasswordService("bad", "curl/8")).rejects.toThrow(UnauthorizedError);
    expect(mockWarn).toHaveBeenCalledWith("Admin: Failed password verification attempt", {
      hasPassword: true,
      ua: "curl/8",
    });
  });

  it("treats a missing password as invalid", async () => {
    mockVerify.mockResolvedValue(false);

    await expect(verifyAdminPasswordService(undefined)).rejects.toThrow(UnauthorizedError);
    expect(mockVerify).toHaveBeenCalledWith(null);
  });
});
