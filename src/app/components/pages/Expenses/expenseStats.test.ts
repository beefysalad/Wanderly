import { describe, expect, it } from "vitest";
import type { Expense } from "@/src/shared/types";
import {
  calculateUnsettledStats,
  filterExpensesForView,
  isExpenseSettled,
  isUserInvolved,
  partitionExpenses,
  shareOf,
  stillOwedToPayer,
} from "./expenseStats";

// ₱100 split three ways, as the API returns it: the leftover centavo sits on the payer.
const expense = (overrides: Partial<Expense>): Expense => ({
  id: "e",
  groupId: "g",
  tripId: "t",
  paidBy: "alice@x.com",
  amount: 100,
  description: "Dinner",
  date: "2026-10-01T00:00:00.000Z",
  splits: [
    { member: "alice@x.com", shareAmount: 33.34 },
    { member: "bob@x.com", shareAmount: 33.33 },
    { member: "cara@x.com", shareAmount: 33.33 },
  ],
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
    expect(isExpenseSettled(expense({ splits: [] }))).toBe(true);
  });
});

describe("isUserInvolved", () => {
  it("is true only for members of the split", () => {
    expect(isUserInvolved(expense({}), "bob@x.com")).toBe(true);
    expect(isUserInvolved(expense({}), "dan@x.com")).toBe(false);
  });
});

describe("shareOf / stillOwedToPayer", () => {
  it("reads each person's share from the split, and nothing for someone outside it", () => {
    expect(shareOf(expense({}), "alice@x.com")).toBe(33.34);
    expect(shareOf(expense({}), "bob@x.com")).toBe(33.33);
    expect(shareOf(expense({}), "dan@x.com")).toBe(0);
  });

  it("adds up the unconfirmed shares of everyone but the payer", () => {
    expect(stillOwedToPayer(expense({}))).toBe(66.66);
    expect(stillOwedToPayer(expense({ paidMembers: ["bob@x.com"] }))).toBe(33.33);
    expect(stillOwedToPayer(expense({ splits: [] }))).toBe(0);
  });
});

describe("calculateUnsettledStats", () => {
  it("counts what others still owe the payer, excluding those who paid", () => {
    const e = expense({ paidMembers: ["bob@x.com"] });

    expect(calculateUnsettledStats([e], "alice@x.com")).toEqual({ youOwe: 0, youAreOwed: 33.33 });
  });

  it("counts the user's own share when they're in the split, haven't paid, and didn't pay", () => {
    expect(calculateUnsettledStats([expense({})], "bob@x.com")).toEqual({ youOwe: 33.33, youAreOwed: 0 });
  });

  it("adds shares up to the exact centavo across expenses", () => {
    const three = [expense({ id: "1" }), expense({ id: "2" }), expense({ id: "3" })];

    expect(calculateUnsettledStats(three, "bob@x.com").youOwe).toBe(99.99);
    expect(calculateUnsettledStats(three, "alice@x.com").youAreOwed).toBe(199.98);
  });

  it("ignores expenses the user already paid their share of or isn't part of", () => {
    const e = expense({ paidMembers: ["bob@x.com"] });

    expect(calculateUnsettledStats([e], "bob@x.com")).toEqual({ youOwe: 0, youAreOwed: 0 });
    expect(calculateUnsettledStats([e], "dan@x.com")).toEqual({ youOwe: 0, youAreOwed: 0 });
  });
});

describe("partitionExpenses / filterExpensesForView", () => {
  const settled = expense({ id: "s", paidMembers: ["bob@x.com", "cara@x.com"] });
  const unsettled = expense({ id: "u" });
  const notMine = expense({ id: "n", splits: [{ member: "dan@x.com", shareAmount: 100 }], paidBy: "dan@x.com" });
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
