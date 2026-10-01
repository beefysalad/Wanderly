import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { transformExpense, transformPaymentLog, type ExpenseWithRelations } from "./transformers";

const alice = { id: "u-alice", email: "alice@x.com", name: "Alice" };
const bob = { id: "u-bob", email: "bob@x.com" };
const cara = { id: "u-cara", email: "cara@x.com" };

const split = (user: { id: string; email: string } | null, tempName: string | null = null) => ({
  id: `s-${user?.id ?? tempName}`,
  expenseId: "e1",
  userId: user?.id ?? null,
  tempName,
  createdAt: new Date("2026-10-01"),
  user,
});

const row = (over: Partial<ExpenseWithRelations>): ExpenseWithRelations => ({
  id: "e1",
  groupId: "g1",
  tripId: "t1",
  paidById: alice.id,
  tempPaidBy: null,
  createdById: alice.id,
  amount: new Prisma.Decimal("100.00"),
  description: "Dinner",
  date: new Date("2026-10-01"),
  category: "food",
  paymentMethod: null,
  accountNumber: null,
  bankName: null,
  accountName: null,
  qrImage: null,
  activityId: null,
  createdAt: new Date("2026-10-01"),
  updatedAt: new Date("2026-10-01"),
  paidBy: alice,
  creator: { ...alice, imageUrl: null },
  splits: [split(alice), split(bob), split(cara)],
  payments: [],
  ...over,
});

describe("transformExpense shares", () => {
  it("returns each split's share to the centavo, with the leftover centavo on the payer", () => {
    expect(transformExpense(row({})).splits).toEqual([
      { member: "alice@x.com", shareAmount: 33.34, isGuest: false },
      { member: "bob@x.com", shareAmount: 33.33, isGuest: false },
      { member: "cara@x.com", shareAmount: 33.33, isGuest: false },
    ]);
  });

  it("puts the leftover on the first person in the split when the payer isn't in it", () => {
    const expense = transformExpense(row({ splits: [split(bob), split(cara), split(null, "Guest Gary")] }));

    expect(expense.splits.map((s) => s.shareAmount)).toEqual([33.34, 33.33, 33.33]);
  });

  it("matches a guest payer to their guest split by name", () => {
    const expense = transformExpense(
      row({ paidById: null, paidBy: null, tempPaidBy: "Guest Gary", splits: [split(bob), split(null, "Guest Gary"), split(cara)] }),
    );

    expect(expense.splits).toEqual([
      { member: "bob@x.com", shareAmount: 33.33, isGuest: false },
      { member: "Guest Gary", shareAmount: 33.34, isGuest: true },
      { member: "cara@x.com", shareAmount: 33.33, isGuest: false },
    ]);
  });

  it("flags a paidByIsGuest expense when the payer has no account", () => {
    const expense = transformExpense(
      row({ paidById: null, paidBy: null, tempPaidBy: "Guest Gary", splits: [split(bob), split(null, "Guest Gary")] }),
    );

    expect(expense.paidByIsGuest).toBe(true);
    expect(transformExpense(row({})).paidByIsGuest).toBe(false);
  });

  it("gives nobody a share when the expense isn't split", () => {
    expect(transformExpense(row({ splits: [] })).splits).toEqual([]);
  });
});

const payment = (
  user: { id: string; email: string } | null,
  status: "pending" | "confirmed" | "rejected",
  tempName: string | null = null,
) => ({
  id: `p-${user?.id ?? tempName}`,
  expenseId: "e1",
  userId: user?.id ?? null,
  tempName,
  status,
  paidAt: new Date("2026-10-01"),
  createdAt: new Date("2026-10-01"),
  user,
});

describe("transformExpense payment status", () => {
  it("splits payments into paidMembers (confirmed) and pendingPayments, and builds the status map", () => {
    const expense = transformExpense(
      row({
        payments: [payment(bob, "confirmed"), payment(cara, "pending"), payment(alice, "rejected")],
      }),
    );

    expect(expense.paidMembers).toEqual(["bob@x.com"]);
    expect(expense.pendingPayments).toEqual(["cara@x.com"]);
    expect(expense.paymentStatusMap).toEqual({
      "bob@x.com": "confirmed",
      "cara@x.com": "pending",
      "alice@x.com": "rejected",
    });
  });

  it("keys a guest split member's payment by their tempName, not by user", () => {
    const expense = transformExpense(
      row({
        splits: [split(bob), split(null, "Guest Gary")],
        payments: [payment(null, "confirmed", "Guest Gary")],
      }),
    );

    expect(expense.paidMembers).toEqual(["Guest Gary"]);
    expect(expense.paymentStatusMap?.["Guest Gary"]).toBe("confirmed");
  });

  it("has no payments recorded when none exist yet", () => {
    const expense = transformExpense(row({ payments: [] }));

    expect(expense.paidMembers).toEqual([]);
    expect(expense.pendingPayments).toEqual([]);
    expect(expense.paymentStatusMap).toEqual({});
  });
});

describe("transformPaymentLog", () => {
  const baseLog = {
    id: "log-1",
    tripId: "t1",
    expenseId: "e1",
    payerId: bob.id,
    payeeId: alice.id,
    payerName: null,
    payeeName: null,
    amount: new Prisma.Decimal("33.33"),
    paymentMethod: "gcash" as const,
    timestamp: new Date("2026-10-01"),
    createdAt: new Date("2026-10-01"),
    expense: { id: "e1", description: "Dinner" },
  };

  it("shows the payer/payee's name (or email if unnamed) and their id/image", () => {
    const result = transformPaymentLog({
      ...baseLog,
      payer: { ...bob, name: "", imageUrl: null },
      payee: { ...alice, imageUrl: "https://img" },
    });

    expect(result.payer).toBe("bob@x.com");
    expect(result.payee).toBe("Alice");
    expect(result.payerEmail).toBe("bob@x.com");
    expect(result.payeeImageUrl).toBe("https://img");
    expect(result.amount).toBe(33.33);
  });

  it("falls back to the frozen name, then 'Former member', once an account is deleted", () => {
    const namedFallback = transformPaymentLog({
      ...baseLog,
      payer: null,
      payerName: "Bob (left)",
      payee: { ...alice, imageUrl: null },
    });
    const noFallback = transformPaymentLog({ ...baseLog, payer: null, payerName: null, payee: null, payeeName: null });

    expect(namedFallback.payer).toBe("Bob (left)");
    expect(namedFallback.payerEmail).toBeUndefined();
    expect(noFallback.payer).toBe("Former member");
    expect(noFallback.payee).toBe("Former member");
  });
});
