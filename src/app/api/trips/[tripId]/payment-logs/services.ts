import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { syncUserToDatabaseService } from "../../../sync/syncService";
import type { DecodedIdToken } from "firebase-admin/auth";
import { PaymentMethod, Decimal } from "@prisma/client/runtime/library";

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
 * Lists all payment logs for a trip
 */
export async function listPaymentLogsService(
  token: DecodedIdToken,
  tripId: string
) {
  await verifyTripAccess(token, tripId);

  const paymentLogs = await prisma.paymentLog.findMany({
    where: { tripId },
    include: {
      payer: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      payee: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      expense: {
        select: {
          id: true,
          description: true,
        },
      },
    },
    orderBy: {
      timestamp: "desc",
    },
  });

  return paymentLogs;
}

/**
 * Creates a payment log when a member marks an expense as paid
 */
export async function createPaymentLogService(
  token: DecodedIdToken,
  tripId: string,
  data: {
    expenseId: string;
    payerEmail: string; // who paid
    payeeEmail: string; // who received payment (the person who originally paid)
    amount: number;
    paymentMethod?: "bank" | "maya" | "gcash";
  }
) {
  const { trip } = await verifyTripAccess(token, tripId);

  // Verify expense exists and belongs to trip
  const expense = await prisma.expense.findUnique({
    where: { id: data.expenseId },
    select: { id: true, tripId: true, amount: true, paymentMethod: true },
  });

  if (!expense || expense.tripId !== tripId) {
    throw new Error("Expense not found or does not belong to this trip");
  }

  // Get user IDs
  const payerId = await getUserIdFromEmail(data.payerEmail);
  const payeeId = await getUserIdFromEmail(data.payeeEmail);

  // Use expense payment method if not provided
  const paymentMethod: PaymentMethod | null =
    data.paymentMethod && data.paymentMethod !== "cash"
      ? (data.paymentMethod as PaymentMethod)
      : expense.paymentMethod;

  // Create payment log
  const paymentLog = await prisma.paymentLog.create({
    data: {
      tripId,
      expenseId: data.expenseId,
      payerId,
      payeeId,
      amount: new Decimal(data.amount),
      paymentMethod,
    },
    include: {
      payer: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      payee: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      expense: {
        select: {
          id: true,
          description: true,
        },
      },
    },
  });

  logger.info("Payment log created", {
    paymentLogId: paymentLog.id,
    tripId,
    expenseId: data.expenseId,
  });

  return paymentLog;
}

