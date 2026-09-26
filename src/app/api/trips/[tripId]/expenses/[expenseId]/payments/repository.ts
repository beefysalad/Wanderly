import prisma from "@/lib/prisma";

/** Expense plus who paid and who it was split with — what payment marking needs. */
export function findExpenseForPayments(expenseId: string) {
  return prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      paidBy: { select: { id: true, email: true } },
      splits: { include: { user: { select: { id: true, email: true } } } },
    },
  });
}

export function upsertPendingPayment(expenseId: string, userId: string) {
  return prisma.expensePayment.upsert({
    where: { expenseId_userId: { expenseId, userId } },
    create: { expenseId, userId, status: "pending" },
    update: { status: "pending" },
  });
}

export function deletePaymentsForMember(expenseId: string, userId: string) {
  return prisma.expensePayment.deleteMany({ where: { expenseId, userId } });
}

/** The payer may confirm or reject before the member has marked themselves paid, so this creates the row if needed. */
export function upsertPaymentStatus(
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
