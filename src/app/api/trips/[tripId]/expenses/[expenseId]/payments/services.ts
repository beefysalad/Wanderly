import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { fromCents } from "@/lib/utils/money";
import type { DecodedIdToken } from "firebase-admin/auth";
import { verifyTripAccess } from "../../../../access";
import { findGroupOwnership } from "../../../../../groups/repository";
import { findUserIdByEmail } from "../../../../repository";
import { NotificationType } from "@prisma/client";
import { createNotificationService } from "../../../../../notifications/services";
import type { ConfirmPaymentBody } from "../../schemas";
import { findExpenseById } from "../../repository";
import { splitShareCents } from "../../transformers";
import {
  confirmPaymentAndLog,
  findExpenseForPayments,
  markPendingAndClearLog,
  recordGuestPayment,
  rejectPaymentAndClearLog,
  unmarkPayment,
  unrecordGuestPayment,
} from "./repository";
import type { MarkPaidBody } from "./schemas";

type ExpenseForPayments = NonNullable<Awaited<ReturnType<typeof findExpenseForPayments>>>;
type SplitEntry = ExpenseForPayments["splits"][number];

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

/** The split entry for a member key (their email, or a guest's tempName). */
function findSplitEntry(expense: ExpenseForPayments, memberKey: string): SplitEntry | undefined {
  return expense.splits.find((split) =>
    split.user ? split.user.email === memberKey : split.tempName === memberKey,
  );
}

/** The member's share of the expense (the same one the API shows), or null if they aren't in the split. */
function shareAmountForMember(expense: ExpenseForPayments, memberKey: string) {
  const splitIndex = expense.splits.findIndex((split) =>
    split.user ? split.user.email === memberKey : split.tempName === memberKey,
  );
  if (splitIndex === -1) return null;
  return fromCents(splitShareCents(expense)[splitIndex]);
}

/** The creator or the payer may record a guest split member's payment — a guest has no account to do it themselves. */
function canRecordGuestPayment(expense: ExpenseForPayments, userId: string) {
  return expense.createdById === userId || expense.paidBy?.id === userId;
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
 *
 * A guest split member (no account) can't self-mark or be confirmed afterwards, so for
 * them this records (or reverses) a confirmed payment directly, and only the expense's
 * creator or payer may call it.
 */
export async function markExpensePaidService(
  token: DecodedIdToken,
  tripId: string,
  expenseId: string,
  data: MarkPaidBody,
) {
  const { trip, user } = await verifyTripAccess(token, tripId);
  const expense = await findExpenseInTrip(expenseId, tripId);

  const splitEntry = findSplitEntry(expense, data.memberEmail);
  if (!splitEntry) {
    throw new NotFoundError("Member is not part of this expense split");
  }

  if (!splitEntry.user) {
    if (!canRecordGuestPayment(expense, user.id)) {
      throw new ForbiddenError("Only the expense creator or payer can record a guest's payment");
    }

    if (data.isPaid) {
      const amount = shareAmountForMember(expense, data.memberEmail) ?? 0;
      await recordGuestPayment(expenseId, data.memberEmail, {
        tripId,
        payeeId: expense.paidBy?.id ?? null,
        payeeName: expense.paidBy ? null : expense.tempPaidBy,
        amount,
        paymentMethod: expense.paymentMethod,
      });

      logger.info("Guest payment recorded", { expenseId, tempName: data.memberEmail, tripId });
    } else {
      await unrecordGuestPayment(expenseId, data.memberEmail);

      logger.info("Guest payment reversed", { expenseId, tempName: data.memberEmail, tripId });
    }

    return reloadExpense(expenseId);
  }

  const memberUserId = splitEntry.user.id;

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
    await markPendingAndClearLog(expenseId, memberUserId);

    logger.info("Expense marked as paid", { expenseId, memberEmail: data.memberEmail, tripId });
  } else {
    await unmarkPayment(expenseId, memberUserId);

    logger.info("Expense unmarked as paid", { expenseId, memberEmail: data.memberEmail, tripId });
  }

  return reloadExpense(expenseId);
}

/**
 * Confirms or rejects a member's payment and notifies them. Only the expense's payer may do
 * this — except when the payer is a guest (no account), in which case the expense's creator
 * confirms on their behalf.
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

  const isPayer = expense.paidById === user.id;
  const isCreatorForGuestPayer = expense.paidById === null && expense.createdById === user.id;
  if (!isPayer && !isCreatorForGuestPayer) {
    throw new ForbiddenError("Only the payer can confirm or reject payments");
  }

  const memberUserId = await requireMemberUserId(data.memberEmail);

  if (data.status === "confirmed") {
    const amount = shareAmountForMember(expense, data.memberEmail);
    await confirmPaymentAndLog(
      expenseId,
      memberUserId,
      amount === null
        ? null
        : {
            tripId,
            // The payee is the expense's payer, not the confirming user — they differ when
            // the creator is confirming on behalf of a guest payer.
            payeeId: expense.paidBy?.id ?? null,
            payeeName: expense.paidBy ? null : expense.tempPaidBy,
            amount,
            paymentMethod: expense.paymentMethod,
          },
    );
  } else {
    await rejectPaymentAndClearLog(expenseId, memberUserId);
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
