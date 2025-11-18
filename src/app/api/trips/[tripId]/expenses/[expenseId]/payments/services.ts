import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { syncUserToDatabaseService } from "../../../../../sync/syncService";
import type { DecodedIdToken } from "firebase-admin/auth";
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
): Promise<{ trip: { groupId: string }; user: { id: string; email: string } }> {
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
 * Marks a member as paid or unpaid for an expense
 * Creates or deletes ExpensePayment record
 * Optionally creates a PaymentLog when marking as paid
 */
export async function markExpensePaidService(
  token: DecodedIdToken,
  tripId: string,
  expenseId: string,
  data: {
    memberEmail: string; // email of member marking as paid
    isPaid: boolean; // true to mark as paid, false to unmark
    createPaymentLog?: boolean; // whether to create a payment log
  }
) {
  const { trip, user } = await verifyTripAccess(token, tripId);

  // Verify expense exists and belongs to trip
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      paidBy: {
        select: {
          id: true,
          email: true,
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
    },
  });

  if (!expense || expense.tripId !== tripId) {
    throw new Error("Expense not found or does not belong to this trip");
  }

  // Get member user ID
  const memberUserId = await getUserIdFromEmail(data.memberEmail);

  // Verify member is in the split list
  const isInSplit = expense.splits.some(
    (split) => split.user.email === data.memberEmail
  );

  if (!isInSplit) {
    throw new Error("Member is not part of this expense split");
  }

  // Verify that the member is marking themselves as paid (self-marking only)
  if (data.isPaid && user.email !== data.memberEmail) {
    throw new Error("You can only mark yourself as paid");
  }

  if (data.isPaid) {
    // Mark as paid - create ExpensePayment with pending status
    await prisma.expensePayment.upsert({
      where: {
        expenseId_userId: {
          expenseId,
          userId: memberUserId,
        },
      },
      create: {
        expenseId,
        userId: memberUserId,
        status: "pending", // Default to pending, requires payer confirmation
      },
      update: {
        status: "pending", // Reset to pending if re-marking
      },
    });

    // Optionally create payment log
    if (data.createPaymentLog) {
      // Calculate amount per person
      const splitCount = expense.splits.length;
      const amountPerPerson = Number(expense.amount) / splitCount;

      await prisma.paymentLog.create({
        data: {
          tripId,
          expenseId,
          payerId: memberUserId,
          payeeId: expense.paidById, // Person who originally paid
          amount: new Decimal(amountPerPerson),
          paymentMethod: expense.paymentMethod,
        },
      });
    }

    logger.info("Expense marked as paid", {
      expenseId,
      memberEmail: data.memberEmail,
      tripId,
    });
  } else {
    // Unmark as paid - delete ExpensePayment
    await prisma.expensePayment.deleteMany({
      where: {
        expenseId,
        userId: memberUserId,
      },
    });

    logger.info("Expense unmarked as paid", {
      expenseId,
      memberEmail: data.memberEmail,
      tripId,
    });
  }

  // Return updated expense
  const updatedExpense = await prisma.expense.findUnique({
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

  return updatedExpense!;
}

/**
 * Confirms or rejects a pending payment
 * Only the payer of the expense can confirm/reject payments
 */
export async function confirmPaymentService(
  token: DecodedIdToken,
  tripId: string,
  expenseId: string,
  data: {
    memberEmail: string; // email of member whose payment is being confirmed/rejected
    status: "confirmed" | "rejected"; // new status
  }
) {
  const { trip, user } = await verifyTripAccess(token, tripId);

  // Verify expense exists and belongs to trip
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      paidBy: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  if (!expense || expense.tripId !== tripId) {
    throw new Error("Expense not found or does not belong to this trip");
  }

  // Verify that the requester is the payer
  if (expense.paidBy.email !== user.email) {
    throw new Error("Only the payer can confirm or reject payments");
  }

  // Get member user ID
  const memberUserId = await getUserIdFromEmail(data.memberEmail);

  // Update the payment status
  await prisma.expensePayment.updateMany({
    where: {
      expenseId,
      userId: memberUserId,
    },
    data: {
      status: data.status,
    },
  });

  // If confirmed, create payment log
  if (data.status === "confirmed") {
    const expenseWithSplits = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        splits: true,
      },
    });

    if (expenseWithSplits) {
      const splitCount = expenseWithSplits.splits.length;
      const amountPerPerson = Number(expenseWithSplits.amount) / splitCount;

      await prisma.paymentLog.create({
        data: {
          tripId,
          expenseId,
          payerId: memberUserId,
          payeeId: expense.paidById,
          amount: new Decimal(amountPerPerson),
          paymentMethod: expense.paymentMethod,
        },
      });
    }
  }

  logger.info("Payment status updated", {
    expenseId,
    memberEmail: data.memberEmail,
    status: data.status,
    tripId,
  });

  // Return updated expense
  const updatedExpense = await prisma.expense.findUnique({
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

  return updatedExpense!;
}
