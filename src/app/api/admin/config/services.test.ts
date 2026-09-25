import { beforeEach, describe, expect, it, vi } from "vitest";

const mockList = vi.fn();
const mockUpsert = vi.fn();
vi.mock("./repository", () => ({
  listAppConfigs: (...a: unknown[]) => mockList(...a),
  upsertAppConfig: (...a: unknown[]) => mockUpsert(...a),
}));
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }));

const { listConfigsService, upsertConfigService } = await import("./services");

beforeEach(() => vi.clearAllMocks());

describe("config services", () => {
  it("lists configs from the repository", async () => {
    mockList.mockResolvedValue([{ key: "a" }]);

    expect(await listConfigsService()).toEqual([{ key: "a" }]);
  });

  it("never lists the retired admin_password row", async () => {
    mockList.mockResolvedValue([{ key: "admin_password" }, { key: "a" }]);

    expect(await listConfigsService()).toEqual([{ key: "a" }]);
  });

  it("upserts by key with the given value", async () => {
    mockUpsert.mockResolvedValue({ key: "k" });

    expect(await upsertConfigService({ key: "k", value: { a: 1 } })).toEqual({ key: "k" });
    expect(mockUpsert).toHaveBeenCalledWith("k", { a: 1 });
  });
});
