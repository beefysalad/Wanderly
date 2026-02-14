import type { Expense, PaymentLog } from "@/src/shared/types";
import type { Prisma } from "@prisma/client";

type ExpenseWithRelations = Prisma.ExpenseGetPayload<{
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
  // Separate payments by status
  const confirmedPayments = prismaExpense.payments
    .filter((p) => p.status === "confirmed")
    .map((p) => p.user.email);
  const pendingPayments = prismaExpense.payments
    .filter((p) => p.status === "pending")
    .map((p) => p.user.email);
  const _rejectedPayments = prismaExpense.payments
    .filter((p) => p.status === "rejected")
    .map((p) => p.user.email);

  // Create payment status map
  const paymentStatusMap: Record<string, "pending" | "confirmed" | "rejected"> =
    {};
  prismaExpense.payments.forEach((payment) => {
    paymentStatusMap[payment.user.email] = payment.status as
      | "pending"
      | "confirmed"
      | "rejected";
  });

  return {
    id: prismaExpense.id,
    groupId: prismaExpense.groupId,
    tripId: prismaExpense.tripId,
    paidBy: prismaExpense.paidBy.email,
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
    splitWith: prismaExpense.splits.map((split) => split.user.email),
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
  return {
    id: prismaPaymentLog.id,
    tripId: prismaPaymentLog.tripId,
    expenseId: prismaPaymentLog.expenseId,
    expenseDescription: prismaPaymentLog.expense.description,
    payer: prismaPaymentLog.payer.name || prismaPaymentLog.payer.email,
    payee: prismaPaymentLog.payee.name || prismaPaymentLog.payee.email,
    payerEmail: prismaPaymentLog.payer.email,
    payeeEmail: prismaPaymentLog.payee.email,
    payerImageUrl: prismaPaymentLog.payer.imageUrl || undefined,
    payeeImageUrl: prismaPaymentLog.payee.imageUrl || undefined,
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
