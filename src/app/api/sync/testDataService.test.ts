import { beforeEach, describe, expect, it, vi } from "vitest";
import { ACTIVITIES_BY_DAY, BUDGETS, EXPENSES, DUMMY_USERS } from "./sampleTripData";

const mockClaim = vi.fn();
const mockRelease = vi.fn();
const mockFindUser = vi.fn();
const mockRun = vi.fn();
vi.mock("./seedRepository", () => ({
  claimSeedFlag: (...a: unknown[]) => mockClaim(...a),
  releaseSeedFlag: (...a: unknown[]) => mockRelease(...a),
  findUserForSeeding: (...a: unknown[]) => mockFindUser(...a),
  runSeedTransaction: (...a: unknown[]) => mockRun(...a),
}));
vi.mock("@/lib/utils/groupCode", () => ({ generateUniqueGroupCode: async () => "CODE1" }));
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }));

const { seedTestData } = await import("./testDataService");

const user = { id: "U", email: "me@x.com", name: "Me" };

type Row = Record<string, unknown>;
const daysBetween = (later: unknown, earlier: unknown) =>
  Math.round(((later as Date).getTime() - (earlier as Date).getTime()) / 86_400_000);

/** A recording SeedOperations whose ids are predictable. */
const makeOps = (overrides: Record<string, unknown> = {}) => {
  let n = 0;
  const created = {
    users: [] as Row[],
    groups: [] as Row[],
    trips: [] as Row[],
    activities: [] as Row[],
    budgets: [] as Row[],
    expenses: [] as Row[],
  };
  const ops = {
    findUserByEmail: vi.fn(async () => null),
    createUser: vi.fn(async (d: Row & { email: string }) => {
      created.users.push(d);
      return { id: `dummy-${created.users.length - 1}`, email: d.email };
    }),
    findGroupByName: vi.fn(async () => null),
    createGroup: vi.fn(async (d: Row) => (created.groups.push(d), { id: "G" })),
    createTrip: vi.fn(async (d: Row) => (created.trips.push(d), { id: "T" })),
    createActivity: vi.fn(async (d: Row) => (created.activities.push(d), { id: `A${n++}` })),
    createBudgets: vi.fn(async (rows: Row[]) => void created.budgets.push(...rows)),
    createExpense: vi.fn(async (d: Row) => void created.expenses.push(d)),
    ...overrides,
  };
  return { ops, created };
};

beforeEach(() => {
  vi.resetAllMocks();
  mockClaim.mockResolvedValue(true);
  mockFindUser.mockResolvedValue(user);
  mockRelease.mockResolvedValue(undefined);
});

describe("seedTestData", () => {
  it("does nothing when another request already claimed the seed flag", async () => {
    mockClaim.mockResolvedValue(false);

    await seedTestData("U");

    expect(mockRun).not.toHaveBeenCalled();
  });

  it("does nothing if the user vanished after the claim", async () => {
    mockFindUser.mockResolvedValue(null);

    await seedTestData("U");

    expect(mockRun).not.toHaveBeenCalled();
  });

  it("creates the shared dummy users only when they don't exist yet", async () => {
    const { ops, created } = makeOps({
      findUserByEmail: vi.fn(async (email: string) =>
        email === DUMMY_USERS[0].email ? { id: "existing", email } : null,
      ),
    });
    mockRun.mockImplementation((work) => work(ops));

    await seedTestData("U");

    expect(created.users).toHaveLength(2);
    expect((created.groups[0].memberUserIds as string[])[1]).toBe("existing");
  });

  it("seeds one group with the user as admin plus three dummy members, and a 5-day trip", async () => {
    const { ops, created } = makeOps();
    mockRun.mockImplementation((work) => work(ops));

    await seedTestData("U");

    expect(created.groups).toHaveLength(1);
    expect(created.groups[0]).toMatchObject({
      createdById: "U",
      adminUserId: "U",
      code: "CODE1",
      memberUserIds: ["U", "dummy-0", "dummy-1", "dummy-2"],
    });
    const [trip] = created.trips;
    expect(trip).toMatchObject({ groupId: "G", createdById: "U", status: "planning" });
    expect(daysBetween(trip.endDate, trip.startDate)).toBe(4);
  });

  it("creates every sample activity, budget and expense with references resolved", async () => {
    const { ops, created } = makeOps();
    mockRun.mockImplementation((work) => work(ops));

    await seedTestData("U");

    expect(created.activities).toHaveLength(ACTIVITIES_BY_DAY.flat().length);
    expect(created.budgets).toHaveLength(BUDGETS.length);
    expect(created.expenses).toHaveLength(EXPENSES.length);

    const activityIds = new Set(created.activities.map((_, i) => `A${i}`));
    for (const row of [...created.budgets, ...created.expenses]) {
      if (row.activityId) expect(activityIds.has(row.activityId as string)).toBe(true);
    }
    // Day N activities are dated N days after the trip start.
    const start = created.trips[0].startDate;
    const firstOfDay2 = created.activities[ACTIVITIES_BY_DAY[0].length];
    expect(daysBetween(firstOfDay2.date, start)).toBe(1);
  });

  it("resolves payers and splits to user ids, and attaches the user's name to bank details", async () => {
    const { ops, created } = makeOps();
    mockRun.mockImplementation((work) => work(ops));

    await seedTestData("U");

    for (const [i, seed] of EXPENSES.entries()) {
      const row = created.expenses[i];
      expect(row.paidById).toBe(seed.paidBy === "self" ? "U" : `dummy-${seed.paidBy}`);
      expect(row.splitUserIds).toEqual(
        seed.splitWith === "everyone"
          ? ["U", "dummy-0", "dummy-1", "dummy-2"]
          : seed.splitWith.map((m) => (m === "self" ? "U" : `dummy-${m}`)),
      );
      if (seed.bankDetails) expect(row.accountName).toBe("Me");
      else expect(row).not.toHaveProperty("accountName");
    }
  });

  it("skips seeding when the sample group already exists", async () => {
    const { ops, created } = makeOps({ findGroupByName: vi.fn(async () => ({ id: "old" })) });
    mockRun.mockImplementation((work) => work(ops));

    await seedTestData("U");

    expect(created.groups).toHaveLength(0);
    expect(mockRelease).not.toHaveBeenCalled();
  });

  it("releases the seed flag and rethrows when seeding fails", async () => {
    mockRun.mockRejectedValue(new Error("db down"));

    await expect(seedTestData("U")).rejects.toThrow("db down");
    expect(mockRelease).toHaveBeenCalledWith("U");
  });

  it("still rethrows the original error if releasing the flag also fails", async () => {
    mockRun.mockRejectedValue(new Error("db down"));
    mockRelease.mockRejectedValue(new Error("also down"));

    await expect(seedTestData("U")).rejects.toThrow("db down");
  });
});
