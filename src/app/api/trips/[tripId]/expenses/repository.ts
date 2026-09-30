import prisma from "@/src/lib/prisma";
import type { PaymentMethod, Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

// Splits come back in the order they were added: leftover centavos are placed by position (see computeShares).
export const SPLIT_ORDER = [{ createdAt: "asc" }, { id: "asc" }] satisfies Prisma.ExpenseSplitOrderByWithRelationInput[];

const EXPENSE_INCLUDE = {
  paidBy: { select: { id: true, email: true, name: true } },
  creator: { select: { id: true, email: true, name: true, imageUrl: true } },
  splits: { include: { user: { select: { id: true, email: true, name: true } } }, orderBy: SPLIT_ORDER },
  payments: { include: { user: { select: { id: true, email: true } } } },
} satisfies Prisma.ExpenseInclude;

export interface SplitRow {
  userId: string | null;
  tempName: string | null;
}

export function listExpensesByTrip(tripId: string) {
  return prisma.expense.findMany({
    where: { tripId },
    include: EXPENSE_INCLUDE,
    orderBy: { date: "desc" },
  });
}

export function findExpenseById(expenseId: string) {
  return prisma.expense.findUnique({ where: { id: expenseId }, include: EXPENSE_INCLUDE });
}

/** Registered-user ids currently in the expense's split, for diffing against a replacement split. */
export async function findExpenseSplitUserIds(expenseId: string): Promise<string[]> {
  const rows = await prisma.expenseSplit.findMany({
    where: { expenseId, userId: { not: null } },
    select: { userId: true },
  });
  return rows.map((row) => row.userId as string);
}

/** Lightweight lookup for ownership checks and notification text. */
export function findExpenseSummary(expenseId: string) {
  return prisma.expense.findUnique({
    where: { id: expenseId },
    select: {
      id: true,
      tripId: true,
      paidById: true,
      createdById: true,
      description: true,
      amount: true,
    },
  });
}

export interface CreateExpenseRow {
  groupId: string;
  tripId: string;
  paidById: string | null;
  tempPaidBy: string | null;
  createdById: string;
  amount: number;
  description: string;
  date: Date;
  category: string | null;
  paymentMethod: PaymentMethod | null;
  accountNumber: string | null;
  bankName: string | null;
  accountName: string | null;
  qrImage: string | null;
  activityId: string | null;
  splits: SplitRow[];
}

export function createExpenseRow({ splits, amount, ...data }: CreateExpenseRow) {
  return prisma.expense.create({
    data: { ...data, amount: new Decimal(amount), splits: { create: splits } },
    include: EXPENSE_INCLUDE,
  });
}

export interface UpdateExpenseRow {
  payer?: { userId: string | null; name: string | null };
  amount?: number;
  description?: string;
  date?: Date;
  category?: string | null;
  paymentMethod?: PaymentMethod | null;
  accountNumber?: string | null;
  bankName?: string | null;
  accountName?: string | null;
  qrImage?: string | null;
  activityId?: string | null;
  /** When present, replaces all existing splits (an empty array clears them). */
  splits?: SplitRow[];
  /** Registered-user ids dropped from the split; their payment status and log for this expense are cleared. */
  removedMemberIds?: string[];
}

export function updateExpenseRow(expenseId: string, changes: UpdateExpenseRow) {
  const { payer, amount, splits, activityId, removedMemberIds, ...plain } = changes;

  const data: Prisma.ExpenseUpdateInput = { ...plain };
  if (payer) {
    data.paidBy = payer.userId ? { connect: { id: payer.userId } } : { disconnect: true };
    data.tempPaidBy = payer.userId ? null : payer.name;
  }
  if (amount !== undefined) data.amount = new Decimal(amount);
  if (activityId !== undefined) {
    data.activity = activityId ? { connect: { id: activityId } } : { disconnect: true };
  }
  if (splits && splits.length > 0) data.splits = { create: splits };

  // Replacing splits is delete + recreate, so do both or neither; members dropped from the
  // split have their stale payment status and log cleared in the same transaction.
  return prisma.$transaction(async (tx) => {
    if (splits) await tx.expenseSplit.deleteMany({ where: { expenseId } });
    if (removedMemberIds && removedMemberIds.length > 0) {
      await tx.expensePayment.deleteMany({ where: { expenseId, userId: { in: removedMemberIds } } });
      await tx.paymentLog.deleteMany({ where: { expenseId, payerId: { in: removedMemberIds } } });
    }
    return tx.expense.update({ where: { id: expenseId }, data, include: EXPENSE_INCLUDE });
  });
}

export function deleteExpenseRow(expenseId: string) {
  return prisma.expense.delete({ where: { id: expenseId } });
}
