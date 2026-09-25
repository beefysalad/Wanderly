import prisma from "@/lib/prisma";
import type { PaymentMethod, Prisma, TripStatus } from "@prisma/client";

/**
 * Atomically claims the "test data seeded" flag: true only for the one caller that flips it
 * from false to true. This prevents concurrent requests from seeding the same user twice
 * (updateMany reports count 0 when the user is missing or already seeded).
 */
export async function claimSeedFlag(userId: string) {
  const result = await prisma.user.updateMany({
    where: { id: userId, hasSeededTestData: false },
    data: { hasSeededTestData: true },
  });
  return result.count > 0;
}

export function releaseSeedFlag(userId: string) {
  return prisma.user.update({ where: { id: userId }, data: { hasSeededTestData: false } });
}

export function findUserForSeeding(userId: string) {
  return prisma.user.findUnique({ where: { id: userId } });
}

export interface NewActivityRow {
  tripId: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  notes: string;
  transportationMode?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
}

export interface NewBudgetRow {
  tripId: string;
  activityId?: string;
  category: string;
  amount: number;
  description: string;
  isBooked: boolean;
}

export interface NewExpenseRow {
  groupId: string;
  tripId: string;
  activityId?: string;
  paidById: string;
  createdById: string;
  amount: number;
  description: string;
  date: Date;
  category: string;
  paymentMethod: PaymentMethod;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  splitUserIds: string[];
}

/** The writes a seeding run performs; every call happens inside the same transaction. */
export interface SeedOperations {
  findUserByEmail(email: string): Promise<{ id: string; email: string } | null>;
  createUser(data: { name: string; email: string; firebaseId: string; imageUrl: string }): Promise<{ id: string; email: string }>;
  findGroupByName(createdById: string, name: string): Promise<{ id: string } | null>;
  createGroup(data: {
    name: string;
    code: string;
    colorScheme: string;
    emoji: string;
    createdById: string;
    memberUserIds: string[];
    adminUserId: string;
  }): Promise<{ id: string }>;
  createTrip(data: {
    groupId: string;
    createdById: string;
    name: string;
    startDate: Date;
    endDate: Date;
    location: string;
    status: TripStatus;
  }): Promise<{ id: string }>;
  createActivity(data: NewActivityRow): Promise<{ id: string }>;
  createBudgets(rows: NewBudgetRow[]): Promise<unknown>;
  createExpense(data: NewExpenseRow): Promise<unknown>;
}

function bindOperations(tx: Prisma.TransactionClient): SeedOperations {
  return {
    findUserByEmail: (email) => tx.user.findUnique({ where: { email } }),
    createUser: (data) => tx.user.create({ data }),
    findGroupByName: (createdById, name) => tx.group.findFirst({ where: { createdById, name } }),
    createGroup: ({ memberUserIds, adminUserId, ...data }) =>
      tx.group.create({
        data: {
          ...data,
          members: {
            create: memberUserIds.map((id) => ({
              userId: id,
              role: id === adminUserId ? "admin" : "member",
            })),
          },
        },
      }),
    createTrip: (data) => tx.trip.create({ data }),
    createActivity: (data) => tx.activity.create({ data }),
    createBudgets: (rows) => tx.budget.createMany({ data: rows }),
    createExpense: ({ splitUserIds, ...data }) =>
      tx.expense.create({
        data: { ...data, splits: { create: splitUserIds.map((userId) => ({ userId })) } },
      }),
  };
}

/** Runs the callback with all-or-nothing semantics. */
export function runSeedTransaction<T>(work: (ops: SeedOperations) => Promise<T>) {
  return prisma.$transaction((tx) => work(bindOperations(tx)));
}
