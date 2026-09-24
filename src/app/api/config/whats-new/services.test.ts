import { beforeEach, describe, expect, it, vi } from "vitest";
import { CURRENT_WHATS_NEW_VERSION, WHATS_NEW_FEATURES } from "@/src/app/config/whats-new";

const mockFind = vi.fn();
const mockUpsert = vi.fn();
vi.mock("./repository", () => ({
  findWhatsNewConfig: (...a: unknown[]) => mockFind(...a),
  upsertWhatsNewConfig: (...a: unknown[]) => mockUpsert(...a),
}));

vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }));

const { getWhatsNewConfigService, updateWhatsNewConfigService } = await import("./services");

beforeEach(() => vi.clearAllMocks());

describe("getWhatsNewConfigService", () => {
  it("falls back to the built-in defaults when nothing has been saved", async () => {
    mockFind.mockResolvedValue(null);

    expect(await getWhatsNewConfigService()).toEqual({
      version: CURRENT_WHATS_NEW_VERSION,
      features: WHATS_NEW_FEATURES,
    });
  });

  it("returns the saved config's value", async () => {
    mockFind.mockResolvedValue({ key: "whats-new", value: { version: "v9", features: [] } });

    expect(await getWhatsNewConfigService()).toEqual({ version: "v9", features: [] });
  });
});

describe("updateWhatsNewConfigService", () => {
  it("stores only the version and features", async () => {
    mockUpsert.mockResolvedValue({ key: "whats-new" });

    await updateWhatsNewConfigService({ version: "v3", features: [] });

    expect(mockUpsert).toHaveBeenCalledWith({ version: "v3", features: [] });
  });
});
