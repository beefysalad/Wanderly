import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { syncUserToDatabaseService } from "../../../sync/syncService";
import type { DecodedIdToken } from "firebase-admin/auth";

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
 * Creates a new activity for a trip
 */
export async function createActivityService(
  token: DecodedIdToken,
  tripId: string,
  data: {
    title: string;
    date: Date;
    startTime?: string;
    endTime?: string;
    notes?: string;
  }
) {
  const { user } = await verifyTripAccess(token, tripId);

  const activity = await prisma.activity.create({
    data: {
      tripId,
      title: data.title,
      date: data.date,
      startTime: data.startTime || null,
      endTime: data.endTime || null,
      notes: data.notes || null,
      done: false,
    },
  });

  logger.info("Activity created", { activityId: activity.id, tripId });
  return activity;
}

/**
 * Updates an activity
 */
export async function updateActivityService(
  token: DecodedIdToken,
  tripId: string,
  activityId: string,
  data: {
    title?: string;
    date?: Date;
    startTime?: string;
    endTime?: string;
    notes?: string;
    done?: boolean;
  }
) {
  await verifyTripAccess(token, tripId);

  // Verify activity belongs to trip
  const existingActivity = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { tripId: true },
  });

  if (!existingActivity || existingActivity.tripId !== tripId) {
    throw new Error("Activity not found or does not belong to this trip");
  }

  const activity = await prisma.activity.update({
    where: { id: activityId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.date !== undefined && { date: data.date }),
      ...(data.startTime !== undefined && { startTime: data.startTime || null }),
      ...(data.endTime !== undefined && { endTime: data.endTime || null }),
      ...(data.notes !== undefined && { notes: data.notes || null }),
      ...(data.done !== undefined && { done: data.done }),
    },
  });

  logger.info("Activity updated", { activityId: activity.id, tripId });
  return activity;
}

/**
 * Deletes an activity
 */
export async function deleteActivityService(
  token: DecodedIdToken,
  tripId: string,
  activityId: string
) {
  await verifyTripAccess(token, tripId);

  // Verify activity belongs to trip
  const existingActivity = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { tripId: true },
  });

  if (!existingActivity || existingActivity.tripId !== tripId) {
    throw new Error("Activity not found or does not belong to this trip");
  }

  await prisma.activity.delete({
    where: { id: activityId },
  });

  logger.info("Activity deleted", { activityId, tripId });
}

