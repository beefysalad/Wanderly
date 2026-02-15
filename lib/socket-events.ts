/**
 * Helper functions to emit Socket.IO events via HTTP API
 */

const SOCKET_SERVER_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8080";
const API_KEY = process.env.SOCKET_API_KEY || "your-secret-api-key";

//eslint-disable-next-line @typescript-eslint/no-explicit-any
async function emitEvent(endpoint: string, data: any) {
  try {
    console.log(`Emitting Socket.IO event: ${endpoint}`, {
      groupId: data.groupId,
    });
    const response = await fetch(
      `${SOCKET_SERVER_URL}/api/events/${endpoint}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to emit event: ${endpoint}`, {
        status: response.status,
        error: errorText,
      });
    } else {
      console.log(`Successfully emitted event: ${endpoint}`);
    }
  } catch (error) {
    console.error(`Error emitting event: ${endpoint}`, error);
  }
}
//
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

export async function emitNotificationToGroup(
  groupId: string,
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  notification: any,
) {
  await emitEvent("notification/group", { groupId, notification });
}
