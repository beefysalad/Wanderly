/**
 * Helper functions to emit Socket.IO events via HTTP API
 */

import { after } from "next/server";
import { logger } from "./logger";

// A private, server-only URL takes priority when set; otherwise the same URL the
// browser uses to connect is reused for these server-to-server calls.
const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || process.env.NEXT_PUBLIC_SOCKET_URL;
const API_KEY = process.env.SOCKET_API_KEY;
const EMIT_TIMEOUT_MS = 5000;

//eslint-disable-next-line @typescript-eslint/no-explicit-any
async function emitEvent(endpoint: string, data: any) {
  if (!API_KEY || !SOCKET_SERVER_URL) {
    logger.error("Socket emit skipped: SOCKET_API_KEY/SOCKET_SERVER_URL is not configured", {
      endpoint,
    });
    return;
  }

  // Deferred via after() so the response isn't held up waiting on the socket server, and so
  // the request isn't torn down (on a serverless runtime) before this fire-and-forget call lands.
  after(async () => {
    try {
      const response = await fetch(`${SOCKET_SERVER_URL}/api/events/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(EMIT_TIMEOUT_MS),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error("Socket emit failed", { endpoint, status: response.status, error: errorText });
      }
    } catch (error) {
      logger.error("Socket emit errored", { endpoint, error });
    }
  });
}

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function emitTripCreated(groupId: string, trip: any) {
  await emitEvent("trip/created", { groupId, trip });
}

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function emitTripUpdated(groupId: string, trip: any) {
  await emitEvent("trip/updated", { groupId, trip });
}

export async function emitTripDeleted(
  groupId: string,
  tripId: string,
  metadata?: { deletedBy?: string; tripName?: string },
) {
  await emitEvent("trip/deleted", { groupId, tripId, ...metadata });
}

export async function emitActivityCreated(
  groupId: string,
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  activity: any,
  metadata?: { createdBy?: string },
) {
  await emitEvent("activity/created", { groupId, activity, ...metadata });
}

export async function emitActivityUpdated(
  groupId: string,
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  activity: any,
  metadata?: { updatedBy?: string },
) {
  await emitEvent("activity/updated", { groupId, activity, ...metadata });
}

export async function emitActivityDeleted(
  groupId: string,
  activityId: string,
  metadata?: { deletedBy?: string; activityTitle?: string },
) {
  await emitEvent("activity/deleted", { groupId, activityId, ...metadata });
}

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function emitExpenseCreated(groupId: string, expense: any) {
  // Ensure expense is properly serialized
  const serializedExpense = {
    ...expense,
    amount:
      typeof expense.amount === "object"
        ? Number(expense.amount)
        : expense.amount,
    date:
      expense.date instanceof Date ? expense.date.toISOString() : expense.date,
    paidBy: expense.paidBy
      ? {
          id: expense.paidBy.id,
          email: expense.paidBy.email,
          name: expense.paidBy.name,
        }
      : expense.paidBy,
  };
  await emitEvent("expense/created", { groupId, expense: serializedExpense });
}

export async function emitExpenseUpdated(
  groupId: string,
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  expense: any,
  metadata?: { updatedBy?: string },
) {
  // Ensure expense is properly serialized
  const serializedExpense = {
    ...expense,
    amount:
      typeof expense.amount === "object"
        ? Number(expense.amount)
        : expense.amount,
    date:
      expense.date instanceof Date ? expense.date.toISOString() : expense.date,
    paidBy: expense.paidBy
      ? {
          id: expense.paidBy.id,
          email: expense.paidBy.email,
          name: expense.paidBy.name,
        }
      : expense.paidBy,
    // Attach updatedBy directly to expense object so it's always available
    updatedBy: metadata?.updatedBy,
  };
  await emitEvent("expense/updated", {
    groupId,
    expense: serializedExpense,
    ...metadata,
  });
}

export async function emitExpenseDeleted(
  groupId: string,
  expenseId: string,
  metadata?: {
    deletedBy?: string;
    expenseDescription?: string;
    tripId?: string;
  },
) {
  await emitEvent("expense/deleted", { groupId, expenseId, ...metadata });
}

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function emitBudgetCreated(groupId: string, budget: any) {
  await emitEvent("budget/created", { groupId, budget });
}

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function emitBudgetUpdated(groupId: string, budget: any) {
  await emitEvent("budget/updated", { groupId, budget });
}

export async function emitBudgetDeleted(groupId: string, budgetId: string, tripId: string) {
  await emitEvent("budget/deleted", { groupId, budgetId, tripId });
}

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function emitGroupUpdated(groupId: string, group: any) {
  await emitEvent("group/updated", { groupId, group });
}

export async function emitGroupDeleted(groupId: string) {
  await emitEvent("group/deleted", { groupId });
}

export async function emitNotificationToUser(
  userId: string,
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  notification: any,
) {
  await emitEvent("notification/user", { userId, notification });
}

/** A bodyless ping: tells the group's room to refetch, without broadcasting one member's private notification text to everyone in it. */
export async function emitNotificationChangedToGroup(groupId: string) {
  await emitEvent("notification/group", { groupId });
}
