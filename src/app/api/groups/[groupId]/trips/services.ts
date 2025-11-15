import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { syncUserToDatabaseService } from "../../../sync/syncService";
import type { DecodedIdToken } from "firebase-admin/auth";
import { TripStatus } from "@prisma/client";

/**
 * Gets or creates a user in the database from Firebase token
 */
async function getOrCreateUser(token: DecodedIdToken) {
  return await syncUserToDatabaseService(token);
}

/**
 * Creates a new trip for a group
 */
export async function createTripService(
  token: DecodedIdToken,
  groupId: string,
  data: {
    name: string;
    startDate: Date;
    endDate: Date;
    location?: string;
    status: TripStatus;
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

  // Create the trip
  const trip = await prisma.trip.create({
    data: {
      groupId,
      createdById: user.id,
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      location: data.location || null,
      status: data.status,
    },
    include: {
      activities: true,
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  logger.info("Trip created", { tripId: trip.id, groupId });
  return trip;
}

