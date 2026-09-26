import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import {
  emitExpenseCreated,
  emitExpenseDeleted,
  emitExpenseUpdated,
} from "@/lib/socket-events";
import { NotificationType, type PaymentMethod } from "@prisma/client";
import type { DecodedIdToken } from "firebase-admin/auth";
import { notifyGroupMembers } from "../../../notifications/notifyMembers";
import { findGroupOwnership } from "../../../groups/repository";
import { assertCanModify } from "../../../groups/permissions";
import { verifyGuestTripAccess, verifyTripAccess } from "../../access";
import { findUserIdByEmail } from "../../repository";
import { findActivityById } from "../activities/repository";
import {
  createExpenseRow,
  deleteExpenseRow,
  findExpenseById,
  findExpenseSummary,
  listExpensesByTrip,
  updateExpenseRow,
  type SplitRow,
  type UpdateExpenseRow,
} from "./repository";
import type { CreateExpenseBody, UpdateExpenseBody } from "./schemas";
import type { ExpenseWithRelations } from "./transformers";

/**
 * A payer/split entry is either a registered user's email or a free-text guest name.
 * An email with no matching user is kept as a plain name rather than rejected.
 */
async function resolveMember(identifier: string) {
  if (identifier.includes("@")) {
    const user = await findUserIdByEmail(identifier);
    if (user) return { userId: user.id, name: null };
  }
  return { userId: null, name: identifier };
}

async function resolveSplits(identifiers: string[]): Promise<SplitRow[]> {
  const resolved = await Promise.all(identifiers.map(resolveMember));
  return resolved.map(({ userId, name }) => ({ userId, tempName: name }));
}

// "cash" and "" both mean "no specific method" and are stored as null.
function toStoredPaymentMethod(method: string | null | undefined): PaymentMethod | null {
  return method && method !== "cash" ? (method as PaymentMethod) : null;
}

async function assertActivityInTrip(activityId: string, tripId: string) {
  const activity = await findActivityById(activityId);
  if (!activity || activity.tripId !== tripId) {
    throw new ValidationError("Activity not found or does not belong to this trip");
  }
}

async function findExpenseInTrip(expenseId: string, tripId: string) {
  const expense = await findExpenseSummary(expenseId);
  if (!expense || expense.tripId !== tripId) {
    throw new NotFoundError("Expense not found");
  }
  return expense;
}

async function assertCanChangeExpense(
  expense: { paidById: string | null; createdById: string | null },
  actorId: string,
  groupId: string,
) {
  const group = await findGroupOwnership(groupId);
  assertCanModify(
    {
      actorId,
      allowedUserIds: [expense.createdById, expense.paidById],
      groupOwnerId: group?.createdById,
    },
    "Only the expense creator, the payer or the group owner can change this expense",
  );
}

// Socket clients expect plain numbers/strings and a paidBy object even for guest payers.
function toSocketExpense(expense: ExpenseWithRelations) {
  return {
    ...expense,
    amount: Number(expense.amount),
    date: expense.date.toISOString(),
    paidBy: expense.paidBy
      ? { id: expense.paidBy.id, email: expense.paidBy.email, name: expense.paidBy.name }
      : { id: "guest", name: expense.tempPaidBy || "Guest", email: "" },
  };
}

export async function listExpensesService(token: DecodedIdToken, tripId: string) {
  await verifyTripAccess(token, tripId);
  return listExpensesByTrip(tripId);
}

export async function listExpensesForGuestService(guestGroupId: string, tripId: string) {
  await verifyGuestTripAccess(guestGroupId, tripId);
  return listExpensesByTrip(tripId);
}

export async function getExpenseByIdService(
  token: DecodedIdToken,
  tripId: string,
  expenseId: string,
) {
  await verifyTripAccess(token, tripId);

  const expense = await findExpenseById(expenseId);
  if (!expense || expense.tripId !== tripId) {
    throw new NotFoundError("Expense not found");
  }
  return expense;
}

export async function createExpenseService(
  token: DecodedIdToken,
  tripId: string,
  data: CreateExpenseBody,
) {
  const { trip, user } = await verifyTripAccess(token, tripId);

  if (data.activityId) {
    await assertActivityInTrip(data.activityId, tripId);
  }

  const payer = await resolveMember(data.paidBy);

  const expense = await createExpenseRow({
    groupId: trip.groupId,
    tripId,
    paidById: payer.userId,
    tempPaidBy: payer.name,
    createdById: user.id,
    amount: data.amount,
    description: data.description,
    date: data.date,
    category: data.category || null,
    paymentMethod: toStoredPaymentMethod(data.paymentMethod),
    accountNumber: data.accountNumber || null,
    bankName: data.bankName || null,
    accountName: data.accountName || null,
    qrImage: data.qrImage || null,
    activityId: data.activityId || null,
    splits: await resolveSplits(data.splitWith),
  });

  await notifyGroupMembers(trip.groupId, user.id, {
    type: NotificationType.expense_added,
    title: "New Expense Added",
    message: `${user.name || user.email} added expense '${data.description}' (₱${data.amount.toFixed(2)}) to ${trip.name}`,
    relatedTripId: tripId,
    relatedExpenseId: expense.id,
  });

  emitExpenseCreated(trip.groupId, toSocketExpense(expense)).catch((err) => {
    logger.error("Failed to emit expense created event", { error: err });
  });

  logger.info("Expense created", { expenseId: expense.id, tripId });
  return expense;
}

export async function updateExpenseService(
  token: DecodedIdToken,
  tripId: string,
  expenseId: string,
  data: UpdateExpenseBody,
) {
  const { trip, user } = await verifyTripAccess(token, tripId);
  const before = await findExpenseInTrip(expenseId, tripId);
  await assertCanChangeExpense(before, user.id, trip.groupId);

  if (data.activityId) {
    await assertActivityInTrip(data.activityId, tripId);
  }

  const changes: UpdateExpenseRow = {
    ...(data.paidBy !== undefined && { payer: await resolveMember(data.paidBy) }),
    ...(data.amount !== undefined && { amount: data.amount }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.date !== undefined && { date: data.date }),
    ...(data.category !== undefined && { category: data.category || null }),
    ...(data.paymentMethod !== undefined && {
      paymentMethod: toStoredPaymentMethod(data.paymentMethod),
    }),
    ...(data.accountNumber !== undefined && { accountNumber: data.accountNumber || null }),
    ...(data.bankName !== undefined && { bankName: data.bankName || null }),
    ...(data.accountName !== undefined && { accountName: data.accountName || null }),
    ...(data.qrImage !== undefined && { qrImage: data.qrImage || null }),
    ...(data.activityId !== undefined && { activityId: data.activityId || null }),
    ...(data.splitWith !== undefined && { splits: await resolveSplits(data.splitWith) }),
  };

  const expense = await updateExpenseRow(expenseId, changes);

  // Only description/amount edits on an expense that had a non-zero amount are broadcast.
  const previousAmount = Number(before.amount);
  if (previousAmount > 0 && (data.description !== undefined || data.amount !== undefined)) {
    await notifyGroupMembers(trip.groupId, user.id, {
      type: NotificationType.expense_edited,
      title: "Expense Updated",
      message: `${user.name || user.email} updated expense '${before.description}' (₱${previousAmount.toFixed(2)}) in ${trip.name}`,
      relatedTripId: tripId,
      relatedExpenseId: expense.id,
    });

    emitExpenseUpdated(trip.groupId, toSocketExpense(expense), {
      updatedBy: user.name || user.email || undefined,
    }).catch((err) => {
      logger.error("Failed to emit expense updated event", { error: err });
    });
  }

  logger.info("Expense updated", { expenseId: expense.id, tripId });
  return expense;
}

export async function deleteExpenseService(
  token: DecodedIdToken,
  tripId: string,
  expenseId: string,
) {
  const { trip, user } = await verifyTripAccess(token, tripId);
  const existing = await findExpenseInTrip(expenseId, tripId);
  await assertCanChangeExpense(existing, user.id, trip.groupId);

  // Notify BEFORE deleting; no relatedExpenseId since the row is about to go.
  await notifyGroupMembers(trip.groupId, user.id, {
    type: NotificationType.expense_deleted,
    title: "Expense Deleted",
    message: `${user.name || user.email} deleted expense '${existing.description}' (₱${Number(existing.amount).toFixed(2)}) from ${trip.name}`,
    relatedTripId: tripId,
  });

  // Cascades to splits, payments and payment logs.
  await deleteExpenseRow(expenseId);

  emitExpenseDeleted(trip.groupId, expenseId, {
    deletedBy: user.name || user.email,
    expenseDescription: existing.description,
    tripId,
  }).catch((err) => {
    logger.error("Failed to emit expense deleted event", { error: err });
  });

  logger.info("Expense deleted", { expenseId, tripId });
}
