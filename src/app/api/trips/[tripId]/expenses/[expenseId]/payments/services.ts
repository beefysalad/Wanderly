import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type { DecodedIdToken } from "firebase-admin/auth";
import { verifyTripAccess } from "../../../../access";
import { findGroupOwnership } from "../../../../../groups/repository";
import { findUserIdByEmail } from "../../../../repository";
import { NotificationType } from "@prisma/client";
import { createNotificationService } from "../../../../../notifications/services";
import {
  createPaymentLogRow,
  deletePaymentLogsForShare,
  findPaymentLogForShare,
} from "../../../payment-logs/repository";
import type { ConfirmPaymentBody } from "../../schemas";
import { findExpenseById } from "../../repository";
import {
  deletePaymentsForMember,
  findExpenseForPayments,
  upsertPaymentStatus,
  upsertPendingPayment,
} from "./repository";
import type { MarkPaidBody } from "./schemas";

type ExpenseForPayments = NonNullable<Awaited<ReturnType<typeof findExpenseForPayments>>>;

async function findExpenseInTrip(expenseId: string, tripId: string) {
  const expense = await findExpenseForPayments(expenseId);
  if (!expense || expense.tripId !== tripId) {
    throw new NotFoundError("Expense not found or does not belong to this trip");
  }
  return expense;
}

async function requireMemberUserId(email: string) {
  const user = await findUserIdByEmail(email);
  if (!user) {
    throw new NotFoundError("Member not found");
  }
  return user.id;
}

// The payment log records the member's equal share of the expense, once it is confirmed.
// A member whose share was already logged (e.g. before logging moved to confirmation) isn't logged twice.
async function logPaymentShare(
  tripId: string,
  expense: ExpenseForPayments,
  payerId: string,
  payeeId: string,
) {
  const splitCount = expense.splits.length;
  if (splitCount === 0) return;
  if (await findPaymentLogForShare(expense.id, payerId)) return;

  await createPaymentLogRow({
    tripId,
    expenseId: expense.id,
    payerId,
    payeeId,
    amount: Number(expense.amount) / splitCount,
    paymentMethod: expense.paymentMethod,
  });
}

async function reloadExpense(expenseId: string) {
  const expense = await findExpenseById(expenseId);
  if (!expense) {
    throw new NotFoundError("Expense not found");
  }
  return expense;
}

/**
 * Marks a member as paid (a pending payment awaiting the payer's confirmation) or unpaid.
 * Marking paid is self-service only. The payment log is written when the payer confirms.
 */
export async function markExpensePaidService(
  token: DecodedIdToken,
  tripId: string,
  expenseId: string,
  data: MarkPaidBody,
) {
  const { trip, user } = await verifyTripAccess(token, tripId);
  const expense = await findExpenseInTrip(expenseId, tripId);
  const memberUserId = await requireMemberUserId(data.memberEmail);

  const isInSplit = expense.splits.some((split) => split.user?.email === data.memberEmail);
  if (!isInSplit) {
    throw new NotFoundError("Member is not part of this expense split");
  }

  if (data.isPaid && user.email !== data.memberEmail) {
    throw new ForbiddenError("You can only mark yourself as paid");
  }

  if (!data.isPaid && user.email !== data.memberEmail) {
    const group = await findGroupOwnership(trip.groupId);
    if (group?.createdById !== user.id) {
      throw new ForbiddenError("You can only un-mark your own payment");
    }
  }

  if (data.isPaid) {
    await upsertPendingPayment(expenseId, memberUserId);

    logger.info("Expense marked as paid", { expenseId, memberEmail: data.memberEmail, tripId });
  } else {
    await deletePaymentsForMember(expenseId, memberUserId);

    logger.info("Expense unmarked as paid", { expenseId, memberEmail: data.memberEmail, tripId });
  }

  return reloadExpense(expenseId);
}

/**
 * Confirms or rejects a member's payment and notifies them. Only the expense's payer may do this.
 * Confirming records the payment log; rejecting removes any log left over for that share.
 */
export async function confirmPaymentService(
  token: DecodedIdToken,
  tripId: string,
  expenseId: string,
  data: ConfirmPaymentBody,
) {
  const { trip, user } = await verifyTripAccess(token, tripId);
  const expense = await findExpenseInTrip(expenseId, tripId);

  if (expense.paidById !== user.id) {
    throw new ForbiddenError("Only the payer can confirm or reject payments");
  }

  const memberUserId = await requireMemberUserId(data.memberEmail);

  await upsertPaymentStatus(expenseId, memberUserId, data.status);

  if (data.status === "confirmed") {
    await logPaymentShare(tripId, expense, memberUserId, user.id);
  } else {
    await deletePaymentLogsForShare(expenseId, memberUserId);
  }

  await createNotificationService(memberUserId, {
    type:
      data.status === "confirmed"
        ? NotificationType.payment_confirmed
        : NotificationType.payment_rejected,
    title: data.status === "confirmed" ? "Payment Confirmed" : "Payment Rejected",
    message: `${user.name || user.email} ${data.status} your payment for '${expense.description}'`,
    relatedGroupId: trip.groupId,
    relatedTripId: tripId,
    relatedExpenseId: expenseId,
  }).catch((err) => {
    logger.error("Failed to create notification", { userId: memberUserId, error: err });
  });

  logger.info("Payment status updated", {
    expenseId,
    memberEmail: data.memberEmail,
    status: data.status,
    tripId,
  });

  return reloadExpense(expenseId);
}
