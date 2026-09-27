import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { transformExpense, type ExpenseWithRelations } from "./transformers";

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
      { member: "alice@x.com", shareAmount: 33.34 },
      { member: "bob@x.com", shareAmount: 33.33 },
      { member: "cara@x.com", shareAmount: 33.33 },
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
      { member: "bob@x.com", shareAmount: 33.33 },
      { member: "Guest Gary", shareAmount: 33.34 },
      { member: "cara@x.com", shareAmount: 33.33 },
    ]);
  });

  it("gives nobody a share when the expense isn't split", () => {
    expect(transformExpense(row({ splits: [] })).splits).toEqual([]);
  });
});
