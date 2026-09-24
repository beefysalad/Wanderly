import type { DecodedIdToken } from "firebase-admin/auth";
import { NotFoundError, ValidationError } from "@/lib/errors";
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
  await verifyTripAccess(token, tripId);

  if (data.activityId) {
    await assertActivityInTrip(data.activityId, tripId);
  }

  return createBudgetRow({
    tripId,
    amount: data.amount,
    description: data.description || null,
    category: data.category || null,
    activityId: data.activityId || null,
    isBooked: data.isBooked ?? false,
  });
}

export async function updateBudgetService(
  token: DecodedIdToken,
  tripId: string,
  budgetId: string,
  updates: UpdateBudgetBody,
) {
  await verifyTripAccess(token, tripId);
  await assertBudgetInTrip(budgetId, tripId);

  if (updates.activityId) {
    await assertActivityInTrip(updates.activityId, tripId);
  }

  return updateBudgetRow(budgetId, {
    ...(updates.amount !== undefined && { amount: updates.amount }),
    ...(updates.description !== undefined && { description: updates.description }),
    ...(updates.category !== undefined && { category: updates.category }),
    ...(updates.activityId !== undefined && { activityId: updates.activityId || null }),
    ...(updates.isBooked !== undefined && { isBooked: updates.isBooked }),
  });
}

export async function deleteBudgetService(
  token: DecodedIdToken,
  tripId: string,
  budgetId: string,
) {
  await verifyTripAccess(token, tripId);
  await assertBudgetInTrip(budgetId, tripId);
  await deleteBudgetRow(budgetId);
}
