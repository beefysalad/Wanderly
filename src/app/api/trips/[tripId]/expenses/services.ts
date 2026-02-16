import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { syncUserToDatabaseService } from "../../../sync/syncService";
import type { DecodedIdToken } from "firebase-admin/auth";
import { PaymentMethod, Prisma, NotificationType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { createNotificationService } from "../../../notifications/services";
import {
  emitExpenseCreated,
  emitExpenseUpdated,
  emitExpenseDeleted,
} from "@/lib/socket-events";
import type { ExpenseWithRelations } from "./transformers";

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
  tripId: string,
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
  tripId: string,
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
      creator: {
        select: {
          id: true,
          email: true,
          name: true,
          imageUrl: true,
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
  tripId: string,
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
  tripId: string,
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
      creator: {
        select: {
          id: true,
          email: true,
          name: true,
          imageUrl: true,
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
  expenseId: string,
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
      creator: {
        select: {
          id: true,
          email: true,
          name: true,
          imageUrl: true,
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
    activityId?: string;
  },
): Promise<ExpenseWithRelations> {
  const { trip, user: userAccess } = await verifyTripAccess(token, tripId);

  // Get full user info for notifications
  const user = await getOrCreateUser(token);

  // Verify activity belongs to trip if provided
  if (data.activityId) {
    const activity = await prisma.activity.findUnique({
      where: { id: data.activityId },
      select: { tripId: true },
    });

    if (!activity || activity.tripId !== tripId) {
      throw new Error("Activity not found or does not belong to this trip");
    }
  }

  // Helper to resolve user ID or return null
  const resolveUser = async (identifier: string) => {
    try {
      if (identifier.includes("@")) {
        const userId = await getUserIdFromEmail(identifier);
        return { userId, name: null };
      }
      return { userId: null, name: identifier };
    } catch {
      return { userId: null, name: identifier };
    }
  };

  const payer = await resolveUser(data.paidBy);

  // Map splitWith emails/names
  const splitWithResolved = await Promise.all(
    data.splitWith.map((identifier) => resolveUser(identifier)),
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
      paidById: payer.userId,
      tempPaidBy: payer.name,
      createdById: user.id,
      amount: new Decimal(data.amount),
      description: data.description,
      date: data.date,
      category: data.category || null,
      paymentMethod,
      accountNumber: data.accountNumber || null,
      bankName: data.bankName || null,
      accountName: data.accountName || null,
      qrImage: data.qrImage || null,
      activityId: data.activityId || null,
      splits: {
        create: splitWithResolved.map((resolved) => ({
          userId: resolved.userId,
          tempName: resolved.name,
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
      creator: {
        select: {
          id: true,
          email: true,
          name: true,
          imageUrl: true,
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

  // Get trip with group info for notifications
  const tripWithGroup = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      group: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Notify all group members (except the creator)
  if (tripWithGroup) {
    const allMembers = await prisma.groupMember.findMany({
      where: { groupId: tripWithGroup.groupId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    const notificationPromises = allMembers
      .filter((member) => member.userId !== userAccess.id)
      .map((member) =>
        createNotificationService(member.userId, {
          type: NotificationType.expense_added,
          title: "New Expense Added",
          message: `${user.name || user.email} added expense '${
            data.description
          }' (₱${data.amount.toFixed(2)}) to ${tripWithGroup.name}`,
          relatedGroupId: tripWithGroup.groupId,
          relatedTripId: tripId,
          relatedExpenseId: expense.id,
        }).catch((err) => {
          logger.error("Failed to create notification", {
            userId: member.userId,
            error: err,
          });
        }),
      );

    await Promise.all(notificationPromises);

    // Emit Socket.IO event for real-time updates
    // Serialize expense properly (convert Decimal to number, ensure paidBy is included)
    const expenseForSocket = {
      ...expense,
      amount: Number(expense.amount),
      date: expense.date.toISOString(),
      paidBy: expense.paidBy
        ? {
            id: expense.paidBy.id,
            email: expense.paidBy.email,
            name: expense.paidBy.name,
          }
        : {
            id: "guest",
            name: expense.tempPaidBy || "Guest",
            email: "",
          },
    };
    emitExpenseCreated(tripWithGroup.groupId, expenseForSocket).catch((err) => {
      logger.error("Failed to emit expense created event", { error: err });
    });
  }

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
    activityId?: string;
  },
): Promise<ExpenseWithRelations> {
  const { user: userAccess } = await verifyTripAccess(token, tripId);

  // Get full user info for notifications
  const user = await getOrCreateUser(token);

  // Verify expense exists and belongs to trip
  const existingExpense = await prisma.expense.findUnique({
    where: { id: expenseId },
    select: { tripId: true },
  });

  if (!existingExpense || existingExpense.tripId !== tripId) {
    throw new Error("Expense not found or does not belong to this trip");
  }

  // Verify activity belongs to trip if provided
  if (data.activityId !== undefined) {
    if (data.activityId) {
      const activity = await prisma.activity.findUnique({
        where: { id: data.activityId },
        select: { tripId: true },
      });

      if (!activity || activity.tripId !== tripId) {
        throw new Error("Activity not found or does not belong to this trip");
      }
    }
  }

  // Prepare update data
  const updateData: Prisma.ExpenseUpdateInput = {};

  // Helper to resolve user ID or return null
  const resolveUser = async (identifier: string) => {
    try {
      if (identifier.includes("@")) {
        const userId = await getUserIdFromEmail(identifier);
        return { userId, name: null };
      }
      return { userId: null, name: identifier };
    } catch {
      return { userId: null, name: identifier };
    }
  };

  if (data.paidBy !== undefined) {
    const payer = await resolveUser(data.paidBy);
    if (payer.userId) {
      updateData.paidBy = { connect: { id: payer.userId } };
      updateData.tempPaidBy = null; // Clear temp if real user
    } else {
      updateData.paidBy = { disconnect: true };
      updateData.tempPaidBy = payer.name;
    }
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
      const splitWithResolved = await Promise.all(
        data.splitWith.map((identifier) => resolveUser(identifier)),
      );

      updateData.splits = {
        create: splitWithResolved.map((resolved) => ({
          userId: resolved.userId,
          tempName: resolved.name,
        })),
      };
    }
  }

  if (data.activityId !== undefined) {
    if (data.activityId) {
      updateData.activity = { connect: { id: data.activityId } };
    } else {
      updateData.activity = { disconnect: true };
    }
  }

  // Get expense description before update for notification
  const expenseBeforeUpdate = await prisma.expense.findUnique({
    where: { id: expenseId },
    select: { description: true, amount: true },
  });

  const expenseAmount = expenseBeforeUpdate?.amount
    ? Number(expenseBeforeUpdate.amount)
    : 0;

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
      creator: {
        select: {
          id: true,
          email: true,
          name: true,
          imageUrl: true,
        },
      },
      splits: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
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

  // Get trip with group info for notifications
  const tripWithGroup = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      group: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Notify all group members (except the editor) - only if significant changes
  if (
    tripWithGroup &&
    expenseBeforeUpdate &&
    expenseAmount > 0 &&
    (data.description !== undefined || data.amount !== undefined)
  ) {
    const allMembers = await prisma.groupMember.findMany({
      where: { groupId: tripWithGroup.groupId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    const notificationPromises = allMembers
      .filter((member) => member.userId !== userAccess.id)
      .map((member) =>
        createNotificationService(member.userId, {
          type: NotificationType.expense_edited,
          title: "Expense Updated",
          message: `${user.name || user.email} updated expense '${
            expenseBeforeUpdate.description
          }' (₱${expenseAmount.toFixed(2)}) in ${tripWithGroup.name}`,
          relatedGroupId: tripWithGroup.groupId,
          relatedTripId: tripId,
          relatedExpenseId: expense.id,
        }).catch((err) => {
          logger.error("Failed to create notification", {
            userId: member.userId,
            error: err,
          });
        }),
      );

    await Promise.all(notificationPromises);

    // Emit Socket.IO event for real-time updates
    // Serialize expense properly (convert Decimal to number, ensure paidBy is included)
    const expenseForSocket = {
      ...expense,
      amount: Number(expense.amount),
      date: expense.date.toISOString(),
      paidBy: expense.paidBy
        ? {
            id: expense.paidBy.id,
            email: expense.paidBy.email,
            name: expense.paidBy.name,
          }
        : {
            id: "guest",
            name: expense.tempPaidBy || "Guest",
            email: "",
          },
    };
    emitExpenseUpdated(tripWithGroup.groupId, expenseForSocket, {
      updatedBy: user.name || user.email || undefined,
    }).catch((err) => {
      logger.error("Failed to emit expense updated event", { error: err });
    });
  }

  logger.info("Expense updated", { expenseId: expense.id, tripId });
  return expense;
}

/**
 * Deletes an expense
 */
export async function deleteExpenseService(
  token: DecodedIdToken,
  tripId: string,
  expenseId: string,
) {
  const { user: userAccess } = await verifyTripAccess(token, tripId);

  // Get full user info for notifications
  const user = await getOrCreateUser(token);

  // Get expense info before deletion
  const existingExpense = await prisma.expense.findUnique({
    where: { id: expenseId },
    select: { tripId: true, description: true, amount: true },
  });

  if (!existingExpense || existingExpense.tripId !== tripId) {
    throw new Error("Expense not found or does not belong to this trip");
  }

  const expenseAmount = existingExpense.amount
    ? Number(existingExpense.amount)
    : 0;

  // Get trip with group info for notifications
  const tripWithGroup = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      group: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Notify all group members (except the deleter) BEFORE deletion
  // This ensures the notification is created before the expense is deleted
  if (tripWithGroup) {
    const allMembers = await prisma.groupMember.findMany({
      where: { groupId: tripWithGroup.groupId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    const notificationPromises = allMembers
      .filter((member) => member.userId !== userAccess.id)
      .map((member) =>
        createNotificationService(member.userId, {
          type: NotificationType.expense_deleted,
          title: "Expense Deleted",
          message: `${user.name || user.email} deleted expense '${
            existingExpense.description
          }' (₱${expenseAmount.toFixed(2)}) from ${tripWithGroup.name}`,
          relatedGroupId: tripWithGroup.groupId,
          relatedTripId: tripId,
          // Don't include relatedExpenseId since the expense will be deleted
        }).catch((err) => {
          logger.error("Failed to create notification", {
            userId: member.userId,
            error: err,
          });
        }),
      );

    await Promise.all(notificationPromises);
  }

  // Delete expense (cascade will handle splits, payments, payment logs)
  // Notifications will have relatedExpenseId set to null due to SetNull
  await prisma.expense.delete({
    where: { id: expenseId },
  });

  // Emit Socket.IO event for real-time updates
  if (tripWithGroup) {
    emitExpenseDeleted(tripWithGroup.groupId, expenseId, {
      deletedBy: user.name || user.email,
      expenseDescription: existingExpense.description,
      tripId: tripId,
    }).catch((err) => {
      logger.error("Failed to emit expense deleted event", { error: err });
    });
  }

  logger.info("Expense deleted", { expenseId, tripId });
}

/**
 * Confirms or rejects a payment
 */
export async function confirmPaymentService(
  token: DecodedIdToken,
  tripId: string,
  expenseId: string,
  data: {
    memberEmail: string;
    status: "confirmed" | "rejected";
  },
): Promise<ExpenseWithRelations> {
  const { user: userAccess } = await verifyTripAccess(token, tripId);
  const user = await getOrCreateUser(token);

  // Get member user ID
  const memberId = await getUserIdFromEmail(data.memberEmail);

  // Get expense to verify permissions and get amount
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      splits: {
        where: { userId: memberId },
      },
      payments: {
        where: { userId: memberId },
      },
      paidBy: {
        select: { id: true, email: true, name: true },
      },
      creator: {
        select: {
          id: true,
          email: true,
          name: true,
          imageUrl: true,
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

  // Only the person who paid for the expense can confirm payments
  if (expense.paidById !== userAccess.id) {
    throw new Error("Only the payer can confirm payments");
  }

  // Update payment status
  await prisma.expensePayment.upsert({
    where: {
      expenseId_userId: {
        expenseId,
        userId: memberId,
      },
    },
    update: {
      status: data.status,
    },
    create: {
      expenseId,
      userId: memberId,
      status: data.status,
    },
  });

  // Get trip with group info for notifications
  const tripWithGroup = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      group: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (tripWithGroup) {
    // Notify the member that their payment was confirmed/rejected
    await createNotificationService(memberId, {
      type:
        data.status === "confirmed"
          ? NotificationType.payment_confirmed
          : NotificationType.payment_rejected,
      title:
        data.status === "confirmed" ? "Payment Confirmed" : "Payment Rejected",
      message: `${user.name || user.email} ${
        data.status
      } your payment for '${expense.description}'`,
      relatedGroupId: tripWithGroup.groupId,
      relatedTripId: tripId,
      relatedExpenseId: expenseId,
    }).catch((err) => {
      logger.error("Failed to create notification", {
        userId: memberId,
        error: err,
      });
    });

    // We should also emit socket event here if needed, but existing events might cover it
    // or we can add a specific event for payment status update.
    // For now, list updates should handle it via polling or if we trigger generic update.
  }

  logger.info(`Payment ${data.status}`, {
    expenseId,
    memberId,
    status: data.status,
  });

  // Return full expense object for transformer
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
      creator: {
        select: {
          id: true,
          email: true,
          name: true,
          imageUrl: true,
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

  if (!updatedExpense) {
    throw new Error("Expense not found after update");
  }

  return updatedExpense;
}
