import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { syncUserToDatabaseService } from "../../../sync/syncService";
import type { DecodedIdToken } from "firebase-admin/auth";
import { PaymentMethod, Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Gets or creates a user in the database from Firebase token
 */
async function getOrCreateUser(token: DecodedIdToken) {
  return await syncUserToDatabaseService(token);
}

/**
 * Verifies user has access to a trip (is member of the group)
 */
async function verifyTripAccess(
  token: DecodedIdToken,
  tripId: string
): Promise<{ trip: { groupId: string }; user: { id: string } }> {
  const user = await getOrCreateUser(token);

  // Get trip with group
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true, groupId: true },
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  // Verify user is a member of the group
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId: trip.groupId,
        userId: user.id,
      },
    },
  });

  if (!membership) {
    throw new Error("User does not have access to this trip");
  }

  return { trip, user };
}

/**
 * Maps email addresses to user IDs
 */
async function mapEmailsToUserIds(
  emails: string[]
): Promise<Map<string, string>> {
  const emailToUserId = new Map<string, string>();

  for (const email of emails) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (user) {
      emailToUserId.set(email, user.id);
    }
  }

  return emailToUserId;
}

/**
 * Gets user ID from email, throws if not found
 */
async function getUserIdFromEmail(email: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    throw new Error(`User with email ${email} not found`);
  }

  return user.id;
}

/**
 * Lists all expenses for a trip
 */
export async function listExpensesService(
  token: DecodedIdToken,
  tripId: string
) {
  await verifyTripAccess(token, tripId);

  const expenses = await prisma.expense.findMany({
    where: { tripId },
    include: {
      paidBy: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      splits: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      },
      payments: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  return expenses;
}

/**
 * Verifies guest has access to a trip using group code
 */
async function verifyTripAccessForGuest(
  groupCode: string,
  tripId: string
): Promise<{ trip: { groupId: string } }> {
  // Get trip with group
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      group: {
        select: { id: true, code: true },
      },
    },
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  // Verify group code matches
  if (trip.group.code !== groupCode.toUpperCase()) {
    throw new Error("Invalid group code");
  }

  return { trip: { groupId: trip.groupId } };
}

/**
 * Lists all expenses for a trip (guest access)
 */
export async function listExpensesForGuestService(
  groupCode: string,
  tripId: string
) {
  await verifyTripAccessForGuest(groupCode, tripId);

  const expenses = await prisma.expense.findMany({
    where: { tripId },
    include: {
      paidBy: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      splits: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      },
      payments: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  return expenses;
}

/**
 * Gets a single expense by ID
 */
export async function getExpenseByIdService(
  token: DecodedIdToken,
  tripId: string,
  expenseId: string
) {
  await verifyTripAccess(token, tripId);

  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      paidBy: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      splits: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      },
      payments: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!expense) {
    throw new Error("Expense not found");
  }

  if (expense.tripId !== tripId) {
    throw new Error("Expense does not belong to this trip");
  }

  return expense;
}

/**
 * Creates a new expense
 */
export async function createExpenseService(
  token: DecodedIdToken,
  tripId: string,
  data: {
    paidBy: string; // email
    amount: number;
    description: string;
    date: Date;
    category?: string;
    paymentMethod?: "cash" | "bank" | "maya" | "gcash";
    accountNumber?: string;
    bankName?: string;
    accountName?: string;
    qrImage?: string;
    splitWith: string[]; // emails
  }
) {
  const { trip, user } = await verifyTripAccess(token, tripId);

  // Get paidBy user ID
  const paidById = await getUserIdFromEmail(data.paidBy);

  // Map splitWith emails to user IDs
  const splitWithUserIds = await Promise.all(
    data.splitWith.map((email) => getUserIdFromEmail(email))
  );

  // Map payment method
  const paymentMethod: PaymentMethod | null =
    data.paymentMethod && data.paymentMethod !== "cash"
      ? (data.paymentMethod as PaymentMethod)
      : null;

  // Create expense with splits
  const expense = await prisma.expense.create({
    data: {
      groupId: trip.groupId,
      tripId,
      paidById,
      amount: new Decimal(data.amount),
      description: data.description,
      date: data.date,
      category: data.category || null,
      paymentMethod,
      accountNumber: data.accountNumber || null,
      bankName: data.bankName || null,
      accountName: data.accountName || null,
      qrImage: data.qrImage || null,
      splits: {
        create: splitWithUserIds.map((userId) => ({
          userId,
        })),
      },
    },
    include: {
      paidBy: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      splits: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      },
      payments: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      },
    },
  });

  logger.info("Expense created", { expenseId: expense.id, tripId });
  return expense;
}

/**
 * Updates an expense
 */
export async function updateExpenseService(
  token: DecodedIdToken,
  tripId: string,
  expenseId: string,
  data: {
    paidBy?: string; // email
    amount?: number;
    description?: string;
    date?: Date;
    category?: string;
    paymentMethod?: "cash" | "bank" | "maya" | "gcash";
    accountNumber?: string;
    bankName?: string;
    accountName?: string;
    qrImage?: string;
    splitWith?: string[]; // emails
  }
) {
  await verifyTripAccess(token, tripId);

  // Verify expense exists and belongs to trip
  const existingExpense = await prisma.expense.findUnique({
    where: { id: expenseId },
    select: { tripId: true },
  });

  if (!existingExpense || existingExpense.tripId !== tripId) {
    throw new Error("Expense not found or does not belong to this trip");
  }

  // Prepare update data
  const updateData: Prisma.ExpenseUpdateInput = {};

  if (data.paidBy !== undefined) {
    const paidById = await getUserIdFromEmail(data.paidBy);
    updateData.paidBy = { connect: { id: paidById } };
  }

  if (data.amount !== undefined) {
    updateData.amount = new Decimal(data.amount);
  }

  if (data.description !== undefined) {
    updateData.description = data.description;
  }

  if (data.date !== undefined) {
    updateData.date = data.date;
  }

  if (data.category !== undefined) {
    updateData.category = data.category || null;
  }

  if (data.paymentMethod !== undefined) {
    updateData.paymentMethod =
      data.paymentMethod && data.paymentMethod !== "cash"
        ? (data.paymentMethod as PaymentMethod)
        : null;
  }

  if (data.accountNumber !== undefined) {
    updateData.accountNumber = data.accountNumber || null;
  }

  if (data.bankName !== undefined) {
    updateData.bankName = data.bankName || null;
  }

  if (data.accountName !== undefined) {
    updateData.accountName = data.accountName || null;
  }

  if (data.qrImage !== undefined) {
    updateData.qrImage = data.qrImage || null;
  }

  // Handle splitWith updates
  if (data.splitWith !== undefined) {
    // Delete existing splits
    await prisma.expenseSplit.deleteMany({
      where: { expenseId },
    });

    // Create new splits
    if (data.splitWith.length > 0) {
      const splitWithUserIds = await Promise.all(
        data.splitWith.map((email) => getUserIdFromEmail(email))
      );

      updateData.splits = {
        create: splitWithUserIds.map((userId) => ({
          userId,
        })),
      };
    }
  }

  const expense = await prisma.expense.update({
    where: { id: expenseId },
    data: updateData,
    include: {
      paidBy: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      splits: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      },
      payments: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      },
    },
  });

  logger.info("Expense updated", { expenseId: expense.id, tripId });
  return expense;
}

/**
 * Deletes an expense
 */
export async function deleteExpenseService(
  token: DecodedIdToken,
  tripId: string,
  expenseId: string
) {
  await verifyTripAccess(token, tripId);

  // Verify expense exists and belongs to trip
  const existingExpense = await prisma.expense.findUnique({
    where: { id: expenseId },
    select: { tripId: true },
  });

  if (!existingExpense || existingExpense.tripId !== tripId) {
    throw new Error("Expense not found or does not belong to this trip");
  }

  // Delete expense (cascade will handle splits, payments, payment logs)
  await prisma.expense.delete({
    where: { id: expenseId },
  });

  logger.info("Expense deleted", { expenseId, tripId });
}

