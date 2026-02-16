import prisma from "@/lib/prisma";
import { syncUserToDatabaseService } from "../../../sync/syncService";
import type { DecodedIdToken } from "firebase-admin/auth";
import { Decimal } from "@prisma/client/runtime/library";

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

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true, groupId: true },
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

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
 * Lists all budget items for a trip
 */
export async function listBudgetsService(
  token: DecodedIdToken,
  tripId: string,
) {
  await verifyTripAccess(token, tripId);

  return await prisma.budget.findMany({
    where: { tripId },
    include: {
      activity: {
        select: {
          id: true,
          title: true,
          date: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Creates a new budget item
 */
export async function createBudgetService(
  token: DecodedIdToken,
  tripId: string,
  data: {
    amount: number;
    description?: string;
    category?: string;
    activityId?: string;
    isBooked?: boolean;
  },
) {
  const { trip } = await verifyTripAccess(token, tripId);

  if (data.activityId) {
    const activity = await prisma.activity.findUnique({
      where: { id: data.activityId },
      select: { tripId: true },
    });

    if (!activity || activity.tripId !== tripId) {
      throw new Error("Activity not found or does not belong to this trip");
    }
  }

  return await prisma.budget.create({
    data: {
      tripId,
      amount: new Decimal(data.amount),
      description: data.description || null,
      category: data.category || null,
      activityId: data.activityId || null,
      isBooked: data.isBooked ?? false,
    },
    include: {
      activity: {
        select: {
          id: true,
          title: true,
          date: true,
        },
      },
    },
  });
}

/**
 * Updates a budget item
 */
export async function updateBudgetService(
  token: DecodedIdToken,
  tripId: string,
  budgetId: string,
  data: {
    amount?: number;
    description?: string;
    category?: string;
    activityId?: string;
    isBooked?: boolean;
  },
) {
  await verifyTripAccess(token, tripId);

  const budget = await prisma.budget.findUnique({
    where: { id: budgetId },
  });

  if (!budget || budget.tripId !== tripId) {
    throw new Error("Budget item not found or does not belong to this trip");
  }

  if (data.activityId) {
    const activity = await prisma.activity.findUnique({
      where: { id: data.activityId },
      select: { tripId: true },
    });

    if (!activity || activity.tripId !== tripId) {
      throw new Error("Activity not found or does not belong to this trip");
    }
  }

  return await prisma.budget.update({
    where: { id: budgetId },
    data: {
      amount: data.amount !== undefined ? new Decimal(data.amount) : undefined,
      description:
        data.description !== undefined ? data.description : undefined,
      category: data.category !== undefined ? data.category : undefined,
      activityId: data.activityId !== undefined ? data.activityId : undefined,
      isBooked: data.isBooked !== undefined ? data.isBooked : undefined,
    },
    include: {
      activity: {
        select: {
          id: true,
          title: true,
          date: true,
        },
      },
    },
  });
}

/**
 * Deletes a budget item
 */
export async function deleteBudgetService(
  token: DecodedIdToken,
  tripId: string,
  budgetId: string,
) {
  await verifyTripAccess(token, tripId);

  const budget = await prisma.budget.findUnique({
    where: { id: budgetId },
  });

  if (!budget || budget.tripId !== tripId) {
    throw new Error("Budget item not found or does not belong to this trip");
  }

  return await prisma.budget.delete({
    where: { id: budgetId },
  });
}
