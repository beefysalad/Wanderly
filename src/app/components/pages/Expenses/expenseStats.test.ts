import { describe, expect, it } from "vitest";
import type { Expense } from "@/src/shared/types";
import {
  calculateSettledStats,
  calculateUnsettledStats,
  filterExpensesForView,
  isExpenseSettled,
  isUserInvolved,
  partitionExpenses,
} from "./expenseStats";

const expense = (overrides: Partial<Expense>): Expense => ({
  id: "e",
  groupId: "g",
  tripId: "t",
  paidBy: "alice@x.com",
  amount: 90,
  description: "Dinner",
  date: "2026-10-01T00:00:00.000Z",
  splitWith: ["alice@x.com", "bob@x.com", "cara@x.com"],
  paidMembers: [],
  ...overrides,
});

describe("isExpenseSettled", () => {
  it("is unsettled while any non-payer in the split hasn't paid", () => {
    expect(isExpenseSettled(expense({ paidMembers: ["bob@x.com"] }))).toBe(false);
  });

  it("is settled once everyone except the payer has paid", () => {
    expect(isExpenseSettled(expense({ paidMembers: ["bob@x.com", "cara@x.com"] }))).toBe(true);
  });

  it("treats an empty split as settled", () => {
    expect(isExpenseSettled(expense({ splitWith: [] }))).toBe(true);
  });
});

describe("isUserInvolved", () => {
  it("is true only for members of the split", () => {
    expect(isUserInvolved(expense({}), "bob@x.com")).toBe(true);
    expect(isUserInvolved(expense({}), "dan@x.com")).toBe(false);
  });
});

describe("calculateUnsettledStats", () => {
  it("counts what others still owe the payer, excluding those who paid", () => {
    const e = expense({ paidMembers: ["bob@x.com"] });

    expect(calculateUnsettledStats([e], "alice@x.com")).toEqual({ youOwe: 0, youAreOwed: 30 });
  });

  it("counts the user's own share when they're in the split, haven't paid, and didn't pay", () => {
    expect(calculateUnsettledStats([expense({})], "bob@x.com")).toEqual({ youOwe: 30, youAreOwed: 0 });
  });

  it("ignores expenses the user already paid their share of or isn't part of", () => {
    const e = expense({ paidMembers: ["bob@x.com"] });

    expect(calculateUnsettledStats([e], "bob@x.com")).toEqual({ youOwe: 0, youAreOwed: 0 });
    expect(calculateUnsettledStats([e], "dan@x.com")).toEqual({ youOwe: 0, youAreOwed: 0 });
  });
});

describe("calculateSettledStats", () => {
  it("sums each expense's per-person share, treating an empty split as one share", () => {
    const total = calculateSettledStats([expense({ amount: 90 }), expense({ amount: 50, splitWith: [] })]);

    expect(total.totalSettled).toBe(30 + 50);
  });
});

describe("partitionExpenses / filterExpensesForView", () => {
  const settled = expense({ id: "s", paidMembers: ["bob@x.com", "cara@x.com"] });
  const unsettled = expense({ id: "u" });
  const notMine = expense({ id: "n", splitWith: ["dan@x.com"], paidBy: "dan@x.com" });
  const all = [settled, unsettled, notMine];

  it("only lists expenses the user is part of in the settled/unsettled tabs", () => {
    const parts = partitionExpenses(all, "bob@x.com");

    expect(parts.settled.map((e) => e.id)).toEqual(["s"]);
    expect(parts.unsettled.map((e) => e.id)).toEqual(["u"]);
  });

  it("picks the list for each view; 'all' shows everything and 'logs' shows none", () => {
    const parts = partitionExpenses(all, "bob@x.com");

    expect(filterExpensesForView("all", all, parts)).toBe(all);
    expect(filterExpensesForView("logs", all, parts)).toEqual([]);
    expect(filterExpensesForView("unsettled", all, parts)).toBe(parts.unsettled);
    expect(filterExpensesForView("settled", all, parts)).toBe(parts.settled);
  });
});
