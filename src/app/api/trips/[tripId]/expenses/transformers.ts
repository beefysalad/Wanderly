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
      };
    };
    payee: {
      select: {
        id: true;
        email: true;
        name: true;
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
  return {
    id: prismaExpense.id,
    groupId: prismaExpense.groupId,
    tripId: prismaExpense.tripId,
    paidBy: prismaExpense.paidBy.email,
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
    paidMembers: prismaExpense.payments.map((payment) => payment.user.email),
    activityId: prismaExpense.activityId || undefined,
  };
}

/**
 * Transforms Prisma PaymentLog model to TypeScript PaymentLog interface
 */
export function transformPaymentLog(
  prismaPaymentLog: PaymentLogWithRelations
): PaymentLog {
  return {
    id: prismaPaymentLog.id,
    tripId: prismaPaymentLog.tripId,
    expenseId: prismaPaymentLog.expenseId,
    expenseDescription: prismaPaymentLog.expense.description,
    payer: prismaPaymentLog.payer.name || prismaPaymentLog.payer.email,
    payee: prismaPaymentLog.payee.name || prismaPaymentLog.payee.email,
    amount: Number(prismaPaymentLog.amount),
    timestamp: prismaPaymentLog.timestamp.toISOString(),
    paymentMethod:
      prismaPaymentLog.paymentMethod === null
        ? undefined
        : (prismaPaymentLog.paymentMethod as "cash" | "bank" | "maya" | "gcash"),
  };
}

