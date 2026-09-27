import prisma from "@/lib/prisma";
import { SPLIT_ORDER } from "../../repository";
import type { PaymentMethod } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

/** Expense plus who paid and who it was split with — what payment marking needs. */
export function findExpenseForPayments(expenseId: string) {
  return prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      paidBy: { select: { id: true, email: true } },
      splits: { include: { user: { select: { id: true, email: true } } }, orderBy: SPLIT_ORDER },
    },
  });
}

/** Self-marks a share pending (awaiting the payer's confirmation), clearing any log left over from a previous confirm/reject cycle so status and payment history stay in sync. */
export function markPendingAndClearLog(expenseId: string, userId: string) {
  return prisma.$transaction([
    prisma.expensePayment.upsert({
      where: { expenseId_userId: { expenseId, userId } },
      create: { expenseId, userId, status: "pending" },
      update: { status: "pending" },
    }),
    prisma.paymentLog.deleteMany({ where: { expenseId, payerId: userId } }),
  ]);
}

/** Removes a member's payment row and any log left for their share. */
export function unmarkPayment(expenseId: string, userId: string) {
  return prisma.$transaction([
    prisma.expensePayment.deleteMany({ where: { expenseId, userId } }),
    prisma.paymentLog.deleteMany({ where: { expenseId, payerId: userId } }),
  ]);
}

function isUniqueConstraintViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: unknown }).code === "P2002";
}

export interface ConfirmLogData {
  tripId: string;
  payeeId: string;
  amount: number;
  paymentMethod: PaymentMethod | null;
}

/**
 * Confirms a member's share. The payer may confirm before the member has marked
 * themselves paid, so this creates the payment row if needed. `log` is null when the
 * member isn't part of the split, in which case only the status is recorded.
 *
 * The PaymentLog `[expenseId, payerId]` unique constraint is what actually prevents a
 * duplicate under a concurrent double-confirm; the `findFirst` below is just an
 * idempotent-retry short-circuit, not the source of truth for uniqueness.
 */
export async function confirmPaymentAndLog(
  expenseId: string,
  userId: string,
  log: ConfirmLogData | null,
) {
  await prisma.$transaction(async (tx) => {
    await tx.expensePayment.upsert({
      where: { expenseId_userId: { expenseId, userId } },
      update: { status: "confirmed" },
      create: { expenseId, userId, status: "confirmed" },
    });

    if (!log) return;

    const existing = await tx.paymentLog.findFirst({
      where: { expenseId, payerId: userId },
      select: { id: true },
    });
    if (existing) return;

    try {
      await tx.paymentLog.create({
        data: {
          tripId: log.tripId,
          expenseId,
          payerId: userId,
          payeeId: log.payeeId,
          amount: new Decimal(log.amount),
          paymentMethod: log.paymentMethod,
        },
      });
    } catch (err) {
      if (isUniqueConstraintViolation(err)) return;
      throw err;
    }
  });
}

/** Rejects a pending share and removes any log left for it. */
export function rejectPaymentAndClearLog(expenseId: string, userId: string) {
  return prisma.$transaction([
    prisma.expensePayment.upsert({
      where: { expenseId_userId: { expenseId, userId } },
      update: { status: "rejected" },
      create: { expenseId, userId, status: "rejected" },
    }),
    prisma.paymentLog.deleteMany({ where: { expenseId, payerId: userId } }),
  ]);
}
