import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPingDatabase = vi.fn();
vi.mock("./repository", () => ({
  pingDatabase: (...a: unknown[]) => mockPingDatabase(...a),
}));

vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }));

const { getHealthService } = await import("./services");

beforeEach(() => vi.clearAllMocks());

describe("getHealthService", () => {
  it("reports ok with the database up when the ping succeeds", async () => {
    mockPingDatabase.mockResolvedValue(true);

    const result = await getHealthService();

    expect(result.status).toBe("ok");
    expect(result.database).toBe("up");
    expect(result.version).toEqual(expect.any(String));
  });

  it("reports degraded with the database down when the ping fails", async () => {
    mockPingDatabase.mockRejectedValue(new Error("connection reset"));

    const result = await getHealthService();

    expect(result.status).toBe("degraded");
    expect(result.database).toBe("down");
  });
});
