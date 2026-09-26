import { beforeEach, describe, expect, it, vi } from "vitest";

const mockWarn = vi.fn();
vi.mock("@/lib/logger", () => ({ logger: { warn: (...a: unknown[]) => mockWarn(...a) } }));

const { auditAdminAction } = await import("./audit");

beforeEach(() => vi.clearAllMocks());

describe("auditAdminAction", () => {
  it("logs the admin, action and target", () => {
    auditAdminAction("boss@x.com", "delete-user", { userId: "u1" });

    expect(mockWarn).toHaveBeenCalledWith("Admin action", {
      admin: "boss@x.com",
      action: "delete-user",
      userId: "u1",
    });
  });

  it("works without a target", () => {
    auditAdminAction("boss@x.com", "clean-test-data");

    expect(mockWarn).toHaveBeenCalledWith("Admin action", {
      admin: "boss@x.com",
      action: "clean-test-data",
    });
  });
});
