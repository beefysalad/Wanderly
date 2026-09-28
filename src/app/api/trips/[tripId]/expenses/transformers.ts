import { computeShares, fromCents, toCents } from "@/lib/utils/money";
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

interface ShareSource {
  amount: Prisma.Decimal | number;
  paidBy: { email: string } | null;
  tempPaidBy: string | null;
  splits: Array<{ user: { email: string } | null; tempName: string | null }>;
}

/** How the API names a split member: their email, or the guest's name. */
export function splitMemberKey(split: ShareSource["splits"][number]): string {
  return split.user?.email || split.tempName || "Unknown";
}

/** How the API names the payer: their email, or the guest's name. */
export function payerKey(expense: Pick<ShareSource, "paidBy" | "tempPaidBy">): string {
  return expense.paidBy?.email || expense.tempPaidBy || "Unknown";
}

/**
 * Each split's share in centavos, aligned with `expense.splits`. Callers must load splits in a stable order
 * (the repositories order them by creation) so the leftover centavos land on the same people every time.
 */
export function splitShareCents(expense: ShareSource): number[] {
  return computeShares(toCents(Number(expense.amount)), expense.splits.map(splitMemberKey), payerKey(expense));
}

// Socket clients expect plain numbers/strings and a paidBy object even for guest payers.
export function toSocketExpense(expense: ExpenseWithRelations) {
  return {
    ...expense,
    amount: Number(expense.amount),
    date: expense.date.toISOString(),
    paidBy: expense.paidBy
      ? { id: expense.paidBy.id, email: expense.paidBy.email, name: expense.paidBy.name }
      : { id: "guest", name: expense.tempPaidBy || "Guest", email: "" },
  };
}

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

  const splitWith = prismaExpense.splits.map(splitMemberKey);
  const shareCents = splitShareCents(prismaExpense);

  return {
    id: prismaExpense.id,
    groupId: prismaExpense.groupId,
    tripId: prismaExpense.tripId,
    paidBy: payerKey(prismaExpense),
    paidByIsGuest: !prismaExpense.paidBy,
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
    splitWith,
    splits: splitWith.map((member, index) => ({
      member,
      shareAmount: fromCents(shareCents[index]),
      isGuest: !prismaExpense.splits[index].user,
    })),
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
