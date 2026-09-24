import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const BUDGET_INCLUDE = {
  activity: { select: { id: true, title: true, date: true } },
} satisfies Prisma.BudgetInclude;

export function listBudgetsByTrip(tripId: string) {
  return prisma.budget.findMany({
    where: { tripId },
    include: BUDGET_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

export function findBudgetById(budgetId: string) {
  return prisma.budget.findUnique({ where: { id: budgetId } });
}

export function findActivityTripId(activityId: string) {
  return prisma.activity.findUnique({
    where: { id: activityId },
    select: { tripId: true },
  });
}

export interface CreateBudgetRow {
  tripId: string;
  amount: number;
  description: string | null;
  category: string | null;
  activityId: string | null;
  isBooked: boolean;
}

export function createBudgetRow(data: CreateBudgetRow) {
  return prisma.budget.create({
    data: { ...data, amount: new Decimal(data.amount) },
    include: BUDGET_INCLUDE,
  });
}

export interface UpdateBudgetRow {
  amount?: number;
  description?: string | null;
  category?: string | null;
  activityId?: string | null;
  isBooked?: boolean;
}

export function updateBudgetRow(budgetId: string, data: UpdateBudgetRow) {
  return prisma.budget.update({
    where: { id: budgetId },
    data: {
      ...data,
      amount: data.amount !== undefined ? new Decimal(data.amount) : undefined,
    },
    include: BUDGET_INCLUDE,
  });
}

export function deleteBudgetRow(budgetId: string) {
  return prisma.budget.delete({ where: { id: budgetId } });
}
