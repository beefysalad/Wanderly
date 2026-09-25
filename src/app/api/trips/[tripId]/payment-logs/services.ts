import { NotFoundError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { NotificationType, type PaymentMethod } from "@prisma/client";
import type { DecodedIdToken } from "firebase-admin/auth";
import { createNotificationService } from "../../../notifications/services";
import { verifyGuestTripAccess, verifyTripAccess } from "../../access";
import { findUserIdByEmail } from "../../repository";
import {
  createPaymentLogRow,
  findExpenseForPayment,
  listPaymentLogsByTrip,
} from "./repository";
import type { CreatePaymentLogBody } from "./schemas";

async function requireUserIdByEmail(email: string) {
  const user = await findUserIdByEmail(email);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  return user.id;
}

export async function listPaymentLogsService(token: DecodedIdToken, tripId: string) {
  await verifyTripAccess(token, tripId);
  return listPaymentLogsByTrip(tripId);
}

export async function listPaymentLogsForGuestService(groupCode: string, tripId: string) {
  await verifyGuestTripAccess(groupCode, tripId);
  return listPaymentLogsByTrip(tripId);
}

export async function createPaymentLogService(
  token: DecodedIdToken,
  tripId: string,
  data: CreatePaymentLogBody,
) {
  const { trip } = await verifyTripAccess(token, tripId);

  const expense = await findExpenseForPayment(data.expenseId);
  if (!expense || expense.tripId !== tripId) {
    throw new ValidationError("Expense not found or does not belong to this trip");
  }

  const payerId = await requireUserIdByEmail(data.payerEmail);
  const payeeId = await requireUserIdByEmail(data.payeeEmail);

  // "cash" (or nothing) falls back to the expense's own payment method.
  const explicitMethod: PaymentMethod | undefined =
    data.paymentMethod && data.paymentMethod !== "cash" ? data.paymentMethod : undefined;

  const paymentLog = await createPaymentLogRow({
    tripId,
    expenseId: data.expenseId,
    payerId,
    payeeId,
    amount: data.amount,
    paymentMethod: explicitMethod ?? expense.paymentMethod,
  });

  try {
    await createNotificationService(payeeId, {
      type: NotificationType.payment,
      title: "Payment Received",
      message: `${paymentLog.payer.name || paymentLog.payer.email} paid you ₱${data.amount.toFixed(2)} for ${paymentLog.expense.description}`,
      relatedGroupId: trip.groupId,
      relatedTripId: tripId,
      relatedExpenseId: data.expenseId,
    });
  } catch (err) {
    logger.error("Failed to create payment notification", { payeeId, error: err });
  }

  logger.info("Payment log created", {
    paymentLogId: paymentLog.id,
    tripId,
    expenseId: data.expenseId,
  });

  return paymentLog;
}
