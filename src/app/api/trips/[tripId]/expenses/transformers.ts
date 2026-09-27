import type { Expense, PaymentLog } from "@/src/shared/types";
import type { Prisma } from "@prisma/client";
import { FORMER_MEMBER } from "../../../groups/transformers";

export type ExpenseWithRelations = Prisma.ExpenseGetPayload<{
  include: {
    paidBy: {
      select: {
        id: true;
        email: true;
        name: true;
      };
    };
    creator: {
      select: {
        id: true;
        email: true;
        name: true;
        imageUrl: true;
      };
    };
    splits: {
      include: {
        user: {
          select: {
            id: true;
            email: true;
          };
        };
      };
    };
    payments: {
      include: {
        user: {
          select: {
            id: true;
            email: true;
          };
        };
      };
    };
  };
}>;

type PaymentLogWithRelations = Prisma.PaymentLogGetPayload<{
  include: {
    payer: {
      select: {
        id: true;
        email: true;
        name: true;
        imageUrl: true;
      };
    };
    payee: {
      select: {
        id: true;
        email: true;
        name: true;
        imageUrl: true;
      };
    };
    expense: {
      select: {
        id: true;
        description: true;
      };
    };
  };
}>;

/**
 * Transforms Prisma Expense model to TypeScript Expense interface
 */
export function transformExpense(prismaExpense: ExpenseWithRelations): Expense {
  // Payments are keyed like splits: by email, or by the name kept once the account was deleted.
  const payments = prismaExpense.payments.map((payment) => ({
    member: payment.user?.email || payment.tempName || "Unknown",
    status: payment.status,
  }));
  const confirmedPayments = payments
    .filter((p) => p.status === "confirmed")
    .map((p) => p.member);
  const pendingPayments = payments
    .filter((p) => p.status === "pending")
    .map((p) => p.member);

  // Create payment status map
  const paymentStatusMap: Record<string, "pending" | "confirmed" | "rejected"> =
    {};
  payments.forEach(({ member, status }) => {
    paymentStatusMap[member] = status;
  });

  return {
    id: prismaExpense.id,
    groupId: prismaExpense.groupId,
    tripId: prismaExpense.tripId,
    paidBy:
      prismaExpense.paidBy?.email || prismaExpense.tempPaidBy || "Unknown",
    createdById: prismaExpense.createdById || undefined,
    createdBy: prismaExpense.creator
      ? {
          id: prismaExpense.creator.id,
          name: prismaExpense.creator.name,
          email: prismaExpense.creator.email,
          imageUrl: prismaExpense.creator.imageUrl || undefined,
        }
      : undefined,
    amount: Number(prismaExpense.amount),
    description: prismaExpense.description,
    date: prismaExpense.date.toISOString(),
    category: prismaExpense.category || undefined,
    splitWith: prismaExpense.splits.map(
      (split) => split.user?.email || split.tempName || "Unknown",
    ),
    paymentMethod:
      prismaExpense.paymentMethod === null
        ? undefined
        : (prismaExpense.paymentMethod as "cash" | "bank" | "maya" | "gcash"),
    accountNumber: prismaExpense.accountNumber || undefined,
    bankName: prismaExpense.bankName || undefined,
    accountName: prismaExpense.accountName || undefined,
    qrImage: prismaExpense.qrImage || undefined,
    paidMembers: confirmedPayments, // Only confirmed payments count as paid
    pendingPayments, // Members with pending payments
    paymentStatusMap, // Map of email -> status
    activityId: prismaExpense.activityId || undefined,
  };
}

/**
 * Transforms Prisma PaymentLog model to TypeScript PaymentLog interface
 */
export function transformPaymentLog(
  prismaPaymentLog: PaymentLogWithRelations,
): PaymentLog {
  const { payer, payee } = prismaPaymentLog;
  return {
    id: prismaPaymentLog.id,
    tripId: prismaPaymentLog.tripId,
    expenseId: prismaPaymentLog.expenseId,
    expenseDescription: prismaPaymentLog.expense.description,
    // A deleted account shows the name copied onto the log when it was deleted.
    payer: payer ? payer.name || payer.email : prismaPaymentLog.payerName || FORMER_MEMBER,
    payee: payee ? payee.name || payee.email : prismaPaymentLog.payeeName || FORMER_MEMBER,
    payerEmail: payer?.email,
    payeeEmail: payee?.email,
    payerImageUrl: payer?.imageUrl || undefined,
    payeeImageUrl: payee?.imageUrl || undefined,
    amount: Number(prismaPaymentLog.amount),
    timestamp: prismaPaymentLog.timestamp.toISOString(),
    paymentMethod:
      prismaPaymentLog.paymentMethod === null
        ? undefined
        : (prismaPaymentLog.paymentMethod as
            | "cash"
            | "bank"
            | "maya"
            | "gcash"),
  };
}
