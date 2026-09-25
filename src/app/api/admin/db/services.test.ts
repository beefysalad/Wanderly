import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFetchUsage = vi.fn();
vi.mock("./cloudinary", () => ({ fetchCloudinaryUsage: (...a: unknown[]) => mockFetchUsage(...a) }));

const mockCountAll = vi.fn();
const mockDbSize = vi.fn();
const mockFindTestUsers = vi.fn();
const mockDeleteSample = vi.fn();
vi.mock("./repository", () => ({
  countAllEntities: (...a: unknown[]) => mockCountAll(...a),
  getDatabaseSizeBytes: (...a: unknown[]) => mockDbSize(...a),
  findSeededTestUserIds: (...a: unknown[]) => mockFindTestUsers(...a),
  deleteSampleData: (...a: unknown[]) => mockDeleteSample(...a),
}));

vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }));

const { cleanTestDataService, getDbStatsService, toCloudinaryStats, toUsageMetric } = await import("./services");

beforeEach(() => {
  vi.resetAllMocks();
  mockCountAll.mockResolvedValue({ users: 3 });
});

describe("toUsageMetric", () => {
  it("computes the used percentage", () => {
    expect(toUsageMetric({ usage: 25, limit: 100 })).toEqual({ used: 25, limit: 100, usedPercent: 25 });
  });

  it("falls back to zeros for missing data or a zero limit", () => {
    expect(toUsageMetric(undefined)).toEqual({ used: 0, limit: 0, usedPercent: 0 });
    expect(toUsageMetric({ usage: 5, limit: 0 }).usedPercent).toBe(0);
  });
});

describe("toCloudinaryStats", () => {
  it("is null without usage data, otherwise maps each resource", () => {
    expect(toCloudinaryStats(null)).toBeNull();
    expect(
      toCloudinaryStats({ plan: "Free", resources: { usage: 1, limit: 4 }, bandwidth: { usage: 2, limit: 4 } }),
    ).toMatchObject({
      plan: "Free",
      storage: { usedPercent: 25 },
      bandwidth: { usedPercent: 50 },
      objects: { used: 0, usedPercent: 0 },
    });
  });
});

describe("getDbStatsService", () => {
  it("returns counts, database size and Cloudinary stats", async () => {
    mockDbSize.mockResolvedValue(1234);
    mockFetchUsage.mockResolvedValue({ plan: "Free" });

    const result = await getDbStatsService();

    expect(result.stats).toEqual({ users: 3 });
    expect(result.usage.database.sizeBytes).toBe(1234);
    expect(result.usage.cloudinary?.plan).toBe("Free");
  });

  it("degrades to 0 / null when size or Cloudinary lookups fail", async () => {
    mockDbSize.mockRejectedValue(new Error("no perms"));
    mockFetchUsage.mockRejectedValue(new Error("no key"));

    const result = await getDbStatsService();

    expect(result.usage).toEqual({ database: { sizeBytes: 0 }, cloudinary: null });
  });
});

describe("cleanTestDataService", () => {
  it("does nothing when no users have seeded test data", async () => {
    mockFindTestUsers.mockResolvedValue([]);

    expect(await cleanTestDataService()).toEqual({ message: "No test data found to clean" });
    expect(mockDeleteSample).not.toHaveBeenCalled();
  });

  it("deletes sample data for the seeded users and reports the counts", async () => {
    mockFindTestUsers.mockResolvedValue(["u1", "u2"]);
    mockDeleteSample.mockResolvedValue({ groups: 3, trips: 1 });

    const result = await cleanTestDataService();

    expect(mockDeleteSample).toHaveBeenCalledWith(["u1", "u2"]);
    expect(result).toEqual({
      success: true,
      message: "Cleaned 3 sample groups and 1 sample trips for 2 users.",
      count: 4,
    });
  });
});
