import prisma from "@/lib/prisma";
import type { PaymentMethod, Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const EXPENSE_INCLUDE = {
  paidBy: { select: { id: true, email: true, name: true } },
  creator: { select: { id: true, email: true, name: true, imageUrl: true } },
  splits: { include: { user: { select: { id: true, email: true, name: true } } } },
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

/** Lightweight lookup for ownership checks and notification text. */
export function findExpenseSummary(expenseId: string) {
  return prisma.expense.findUnique({
    where: { id: expenseId },
    select: { id: true, tripId: true, paidById: true, description: true, amount: true },
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
}

export function updateExpenseRow(expenseId: string, changes: UpdateExpenseRow) {
  const { payer, amount, splits, activityId, ...plain } = changes;

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

  // Replacing splits is delete + recreate, so do both or neither.
  return prisma.$transaction(async (tx) => {
    if (splits) await tx.expenseSplit.deleteMany({ where: { expenseId } });
    return tx.expense.update({ where: { id: expenseId }, data, include: EXPENSE_INCLUDE });
  });
}

export function deleteExpenseRow(expenseId: string) {
  return prisma.expense.delete({ where: { id: expenseId } });
}

export function upsertExpensePaymentStatus(
  expenseId: string,
  userId: string,
  status: "confirmed" | "rejected",
) {
  return prisma.expensePayment.upsert({
    where: { expenseId_userId: { expenseId, userId } },
    update: { status },
    create: { expenseId, userId, status },
  });
}
