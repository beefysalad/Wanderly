import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockList = vi.fn();
const mockUpsert = vi.fn();
const mockFindAppConfig = vi.fn();
vi.mock("./repository", () => ({
  listAppConfigs: (...a: unknown[]) => mockList(...a),
  upsertAppConfig: (...a: unknown[]) => mockUpsert(...a),
  findAppConfig: (...a: unknown[]) => mockFindAppConfig(...a),
}));

const mockRevalidateTag = vi.fn();
vi.mock("next/cache", () => ({
  revalidateTag: (...a: unknown[]) => mockRevalidateTag(...a),
  // The real unstable_cache requires a Next.js request/static-generation scope that
  // doesn't exist under Vitest; tests only need the wrapped function's own logic.
  unstable_cache: (fn: (...a: unknown[]) => unknown) => fn,
}));

const mockLoggerError = vi.fn();
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: (...a: unknown[]) => mockLoggerError(...a), warn: vi.fn() },
}));

const { getMaintenanceConfigService, listConfigsService, upsertConfigService } =
  await import("./services");

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

  it("does not revalidate the maintenance cache for an unrelated key", async () => {
    mockUpsert.mockResolvedValue({ key: "k" });

    await upsertConfigService({ key: "k", value: { a: 1 } });

    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });

  it("revalidates the maintenance cache when that key is updated", async () => {
    mockUpsert.mockResolvedValue({ key: "maintenance-mode" });

    await upsertConfigService({ key: "maintenance-mode", value: true });

    expect(mockRevalidateTag).toHaveBeenCalledWith("maintenance-config");
  });
});

describe("getMaintenanceConfigService", () => {
  const ORIGINAL_ENV = process.env.NEXT_PUBLIC_MAINTENANCE_MODE;

  afterEach(() => {
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE = ORIGINAL_ENV;
  });

  it("falls back to the env flag when no row exists", async () => {
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE = "true";
    mockFindAppConfig.mockResolvedValue(null);

    expect(await getMaintenanceConfigService()).toEqual({
      isMaintenanceMode: true,
      maintenanceEstimate: "30-60 Minutes",
    });
  });

  it("reads a raw boolean value", async () => {
    mockFindAppConfig.mockResolvedValue({ value: true });

    expect(await getMaintenanceConfigService()).toEqual({
      isMaintenanceMode: true,
      maintenanceEstimate: "30-60 Minutes",
    });
  });

  it("reads an object value with enabled and estimate", async () => {
    mockFindAppConfig.mockResolvedValue({ value: { enabled: true, estimate: "2 hours" } });

    expect(await getMaintenanceConfigService()).toEqual({
      isMaintenanceMode: true,
      maintenanceEstimate: "2 hours",
    });
  });

  it("falls back to the env flag and logs on an invalid value", async () => {
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE = "false";
    mockFindAppConfig.mockResolvedValue({ value: "not-valid" });

    expect(await getMaintenanceConfigService()).toEqual({
      isMaintenanceMode: false,
      maintenanceEstimate: "30-60 Minutes",
    });
    expect(mockLoggerError).toHaveBeenCalled();
  });

  it("falls back to the env flag and logs when the read throws", async () => {
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE = "true";
    mockFindAppConfig.mockRejectedValue(new Error("connection reset"));

    expect(await getMaintenanceConfigService()).toEqual({
      isMaintenanceMode: true,
      maintenanceEstimate: "30-60 Minutes",
    });
    expect(mockLoggerError).toHaveBeenCalled();
  });
});
