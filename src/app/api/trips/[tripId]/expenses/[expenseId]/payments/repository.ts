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

/** No-op (rather than an error) when the member has no payment record yet. */
export function updatePaymentStatus(
  expenseId: string,
  userId: string,
  status: "confirmed" | "rejected",
) {
  return prisma.expensePayment.updateMany({ where: { expenseId, userId }, data: { status } });
}
