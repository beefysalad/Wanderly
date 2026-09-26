import { describe, expect, it } from "vitest";
import type { Expense, Group } from "@/src/shared/types";
import { categoryKey, expenseStatusLine, payerIdentity, spendingByCategory } from "./expenseView";

const me = "me@x.com";
const exp = (over: Partial<Expense>): Expense => ({
  id: "e",
  groupId: "g",
  tripId: "t",
  paidBy: "mj@x.com",
  amount: 900,
  description: "d",
  date: "",
  splitWith: [me, "mj@x.com", "rc@x.com"],
  paidMembers: [],
  pendingPayments: [],
  ...over,
});

describe("categoryKey", () => {
  it("accepts any case, the transportation alias, and falls back to other", () => {
    expect(categoryKey("Food")).toBe("food");
    expect(categoryKey("transportation")).toBe("transport");
    expect(categoryKey("Accommodation")).toBe("accommodation");
    expect(categoryKey(undefined)).toBe("other");
    expect(categoryKey("weird")).toBe("other");
  });
});

describe("expenseStatusLine", () => {
  it("says what you owe when you're in the split and haven't paid", () => {
    expect(expenseStatusLine(exp({}), me)).toEqual({ text: "You owe ₱300", tone: "owe" });
  });

  it("shows waiting, settled and not-in-split", () => {
    expect(expenseStatusLine(exp({ pendingPayments: [me] }), me).tone).toBe("waiting");
    expect(expenseStatusLine(exp({ paidMembers: [me] }), me)).toEqual({ text: "Settled", tone: "muted" });
    expect(expenseStatusLine(exp({ splitWith: ["mj@x.com", "rc@x.com"] }), me).text).toBe("Not in split");
  });

  it("tells the payer what is still owed to them, or that everyone paid", () => {
    expect(expenseStatusLine(exp({ paidBy: me }), me)).toEqual({ text: "You're owed ₱600", tone: "owed" });
    expect(expenseStatusLine(exp({ paidBy: me, paidMembers: ["mj@x.com", "rc@x.com"] }), me)).toEqual({
      text: "All paid back",
      tone: "muted",
    });
  });
});

describe("spendingByCategory", () => {
  it("totals per category, biggest first, with shares and relative bar lengths", () => {
    const rows = spendingByCategory([
      exp({ category: "food", amount: 1000 }),
      exp({ category: "Food", amount: 500 }),
      exp({ category: "transport", amount: 500 }),
    ]);
    expect(rows.map((r) => r.key)).toEqual(["food", "transport"]);
    expect(rows[0]).toMatchObject({ amount: 1500, percent: 75, relative: 100 });
    expect(rows[1]).toMatchObject({ amount: 500, percent: 25 });
    expect(rows[1].relative).toBeCloseTo(33.33, 1);
  });

  it("is empty with no expenses", () => {
    expect(spendingByCategory([])).toEqual([]);
  });
});

describe("payerIdentity", () => {
  const group = { memberNames: { "mj@x.com": "MJ Santos" }, memberMetadata: { "mj@x.com": { joinedAt: "", imageUrl: "u.png" } } } as unknown as Group;
  it("prefers the member's name and photo, says You for yourself, and copes with free-text payers", () => {
    expect(payerIdentity(group, "mj@x.com", me)).toMatchObject({ name: "MJ Santos", short: "MJ", imageUrl: "u.png", isYou: false });
    expect(payerIdentity(group, me, me)).toMatchObject({ short: "You", isYou: true });
    expect(payerIdentity(group, "Ate Joy", me).name).toBe("Ate Joy");
  });
});
