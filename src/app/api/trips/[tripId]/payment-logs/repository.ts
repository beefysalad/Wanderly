import prisma from "@/lib/prisma";
import type { PaymentMethod, Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const PAYMENT_LOG_INCLUDE = {
  payer: { select: { id: true, email: true, name: true, imageUrl: true } },
  payee: { select: { id: true, email: true, name: true, imageUrl: true } },
  expense: { select: { id: true, description: true } },
} satisfies Prisma.PaymentLogInclude;

export function listPaymentLogsByTrip(tripId: string) {
  return prisma.paymentLog.findMany({
    where: { tripId },
    include: PAYMENT_LOG_INCLUDE,
    orderBy: { timestamp: "desc" },
  });
}

export function findExpenseForPayment(expenseId: string) {
  return prisma.expense.findUnique({
    where: { id: expenseId },
    select: { id: true, tripId: true, paymentMethod: true },
  });
}

export interface CreatePaymentLogRow {
  tripId: string;
  expenseId: string;
  payerId: string;
  payeeId: string;
  amount: number;
  paymentMethod: PaymentMethod | null;
}

export function createPaymentLogRow(data: CreatePaymentLogRow) {
  return prisma.paymentLog.create({
    data: { ...data, amount: new Decimal(data.amount) },
    include: PAYMENT_LOG_INCLUDE,
  });
}
