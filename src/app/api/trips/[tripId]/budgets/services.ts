import type { DecodedIdToken } from "firebase-admin/auth";
import { NotFoundError, ValidationError } from "@/src/lib/errors";
import { logger } from "@/src/lib/logger";
import { emitBudgetCreated, emitBudgetDeleted, emitBudgetUpdated } from "@/src/lib/socket-events";
import { verifyTripAccess } from "../../access";
import {
  createBudgetRow,
  deleteBudgetRow,
  findActivityTripId,
  findBudgetById,
  listBudgetsByTrip,
  updateBudgetRow,
} from "./repository";
import type { CreateBudgetBody, UpdateBudgetBody } from "./schemas";

// Socket clients expect a plain number, not a Decimal.
//eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSocketBudget(budget: any) {
  return { ...budget, amount: Number(budget.amount) };
}

async function assertActivityInTrip(activityId: string, tripId: string) {
  const activity = await findActivityTripId(activityId);
  if (!activity || activity.tripId !== tripId) {
    throw new ValidationError("Activity not found or does not belong to this trip");
  }
}

async function assertBudgetInTrip(budgetId: string, tripId: string) {
  const budget = await findBudgetById(budgetId);
  if (!budget || budget.tripId !== tripId) {
    throw new NotFoundError("Budget item not found");
  }
}

export async function listBudgetsService(token: DecodedIdToken, tripId: string) {
  await verifyTripAccess(token, tripId);
  return listBudgetsByTrip(tripId);
}

export async function createBudgetService(
  token: DecodedIdToken,
  tripId: string,
  data: CreateBudgetBody,
) {
  const { trip } = await verifyTripAccess(token, tripId);

  if (data.activityId) {
    await assertActivityInTrip(data.activityId, tripId);
  }

  const budget = await createBudgetRow({
    tripId,
    amount: data.amount,
    description: data.description || null,
    category: data.category || null,
    activityId: data.activityId || null,
    isBooked: data.isBooked ?? false,
  });

  emitBudgetCreated(trip.groupId, toSocketBudget(budget)).catch((err) => {
    logger.error("Failed to emit budget created event", { error: err });
  });

  return budget;
}

export async function updateBudgetService(
  token: DecodedIdToken,
  tripId: string,
  budgetId: string,
  updates: UpdateBudgetBody,
) {
  const { trip } = await verifyTripAccess(token, tripId);
  await assertBudgetInTrip(budgetId, tripId);

  if (updates.activityId) {
    await assertActivityInTrip(updates.activityId, tripId);
  }

  const budget = await updateBudgetRow(budgetId, {
    ...(updates.amount !== undefined && { amount: updates.amount }),
    ...(updates.description !== undefined && { description: updates.description }),
    ...(updates.category !== undefined && { category: updates.category }),
    ...(updates.activityId !== undefined && { activityId: updates.activityId || null }),
    ...(updates.isBooked !== undefined && { isBooked: updates.isBooked }),
  });

  emitBudgetUpdated(trip.groupId, toSocketBudget(budget)).catch((err) => {
    logger.error("Failed to emit budget updated event", { error: err });
  });

  return budget;
}

export async function deleteBudgetService(
  token: DecodedIdToken,
  tripId: string,
  budgetId: string,
) {
  const { trip } = await verifyTripAccess(token, tripId);
  await assertBudgetInTrip(budgetId, tripId);
  await deleteBudgetRow(budgetId);

  emitBudgetDeleted(trip.groupId, budgetId, tripId).catch((err) => {
    logger.error("Failed to emit budget deleted event", { error: err });
  });
}
