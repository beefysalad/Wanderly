import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { syncUserToDatabaseService } from "../../../sync/syncService";
import type { DecodedIdToken } from "firebase-admin/auth";
import { TripStatus, NotificationType } from "@prisma/client";
import { createNotificationService } from "../../../notifications/services";
import { emitTripCreated } from "@/lib/socket-events";

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

  // Notify all group members (except the creator)
  const allMembers = await prisma.groupMember.findMany({
    where: { groupId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  const notificationPromises = allMembers
    .filter((member) => member.userId !== user.id)
    .map((member) =>
      createNotificationService(member.userId, {
        type: NotificationType.trip_created,
        title: "New Trip Created",
        message: `${user.name || user.email} created trip '${data.name}' in ${group.name}`,
        relatedGroupId: groupId,
        relatedTripId: trip.id,
      }).catch((err) => {
        logger.error("Failed to create notification", {
          userId: member.userId,
          error: err,
        });
      })
    );

  await Promise.all(notificationPromises);

  // Emit Socket.IO event for real-time updates
  emitTripCreated(groupId, trip).catch((err) => {
    logger.error("Failed to emit trip created event", { error: err });
  });

  logger.info("Trip created", { tripId: trip.id, groupId });
  return trip;
}

