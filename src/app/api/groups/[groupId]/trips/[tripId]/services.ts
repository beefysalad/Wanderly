import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { syncUserToDatabaseService } from "../../../../sync/syncService";
import type { DecodedIdToken } from "firebase-admin/auth";
import { TripStatus } from "@prisma/client";

/**
 * Gets or creates a user in the database from Firebase token
 */
async function getOrCreateUser(token: DecodedIdToken) {
  return await syncUserToDatabaseService(token);
}

/**
 * Deletes a trip
 */
export async function deleteTripService(
  token: DecodedIdToken,
  groupId: string,
  tripId: string
) {
  const user = await getOrCreateUser(token);

  // Verify user is a member of the group
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: user.id,
      },
    },
  });

  if (!membership) {
    throw new Error("User is not a member of this group");
  }

  // Verify group exists
  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });

  if (!group) {
    throw new Error("Group not found");
  }

  // Verify trip exists and belongs to group
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true, groupId: true },
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  if (trip.groupId !== groupId) {
    throw new Error("Trip does not belong to this group");
  }

  // Delete the trip (cascade will handle activities, expenses, etc.)
  await prisma.trip.delete({
    where: { id: tripId },
  });

  logger.info("Trip deleted", { tripId, groupId });
}

/**
 * Updates a trip
 */
export async function updateTripService(
  token: DecodedIdToken,
  groupId: string,
  tripId: string,
  data: {
    name?: string;
    startDate?: Date;
    endDate?: Date;
    location?: string;
    status?: TripStatus;
  }
) {
  const user = await getOrCreateUser(token);

  // Verify user is a member of the group
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: user.id,
      },
    },
  });

  if (!membership) {
    throw new Error("User is not a member of this group");
  }

  // Verify group exists
  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });

  if (!group) {
    throw new Error("Group not found");
  }

  // Verify trip exists and belongs to group
  const existingTrip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true, groupId: true },
  });

  if (!existingTrip) {
    throw new Error("Trip not found");
  }

  if (existingTrip.groupId !== groupId) {
    throw new Error("Trip does not belong to this group");
  }

  // Update the trip
  const trip = await prisma.trip.update({
    where: { id: tripId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.startDate !== undefined && { startDate: data.startDate }),
      ...(data.endDate !== undefined && { endDate: data.endDate }),
      ...(data.location !== undefined && { location: data.location || null }),
      ...(data.status !== undefined && { status: data.status }),
    },
    include: {
      activities: true,
    },
  });

  logger.info("Trip updated", { tripId, groupId });
  return trip;
}
