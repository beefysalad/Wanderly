import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { syncUserToDatabaseService } from "../../../sync/syncService";
import type { DecodedIdToken } from "firebase-admin/auth";
import { NotificationType } from "@prisma/client";
import { createNotificationService } from "../../../notifications/services";
import {
  emitActivityCreated,
  emitActivityUpdated,
  emitActivityDeleted,
} from "@/lib/socket-events";

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
): Promise<{
  trip: { groupId: string; name: string };
  user: { id: string; name: string | null; email: string };
}> {
  const user = await getOrCreateUser(token);

  // Get trip with group
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true, groupId: true, name: true },
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

  return { trip, user: { id: user.id, name: user.name, email: user.email } };
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
    transportationMode?: string;
    pickupTime?: string;
    pickupLocation?: string;
    dropoffLocation?: string;
  },
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
      transportationMode: data.transportationMode || null,
      pickupTime: data.pickupTime || null,
      pickupLocation: data.pickupLocation || null,
      dropoffLocation: data.dropoffLocation || null,
    },
  });

  // Get trip with group info for notifications
  const tripWithGroup = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      group: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Notify all group members (except the creator)
  if (tripWithGroup) {
    const allMembers = await prisma.groupMember.findMany({
      where: { groupId: tripWithGroup.groupId },
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
          type: NotificationType.activity_added,
          title: "New Activity Added",
          message: `${user.name || user.email} added activity '${
            data.title
          }' to ${tripWithGroup.name}`,
          relatedGroupId: tripWithGroup.groupId,
          relatedTripId: tripId,
          relatedActivityId: activity.id,
        }).catch((err) => {
          logger.error("Failed to create notification", {
            userId: member.userId,
            error: err,
          });
        }),
      );

    await Promise.all(notificationPromises);

    // Emit Socket.IO event for real-time updates with creator info
    emitActivityCreated(tripWithGroup.groupId, activity, {
      createdBy: user.email || user.name || undefined,
    }).catch((err) => {
      logger.error("Failed to emit activity created event", { error: err });
    });
  }

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
    transportationMode?: string;
    pickupTime?: string;
    pickupLocation?: string;
    dropoffLocation?: string;
  },
) {
  const { user } = await verifyTripAccess(token, tripId);

  // Verify activity belongs to trip
  const existingActivity = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { tripId: true },
  });

  if (!existingActivity || existingActivity.tripId !== tripId) {
    throw new Error("Activity not found or does not belong to this trip");
  }

  // Get activity title before update for notification
  const activityBeforeUpdate = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { title: true },
  });

  const activity = await prisma.activity.update({
    where: { id: activityId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.date !== undefined && { date: data.date }),
      ...(data.startTime !== undefined && {
        startTime: data.startTime || null,
      }),
      ...(data.endTime !== undefined && { endTime: data.endTime || null }),
      ...(data.notes !== undefined && { notes: data.notes || null }),
      ...(data.done !== undefined && { done: data.done }),
      ...(data.transportationMode !== undefined && {
        transportationMode: data.transportationMode || null,
      }),
      ...(data.pickupTime !== undefined && {
        pickupTime: data.pickupTime || null,
      }),
      ...(data.pickupLocation !== undefined && {
        pickupLocation: data.pickupLocation || null,
      }),
      ...(data.dropoffLocation !== undefined && {
        dropoffLocation: data.dropoffLocation || null,
      }),
    },
  });

  // Get trip with group info for notifications
  const tripWithGroup = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      group: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Notify all group members (except the editor) - only if significant changes
  if (
    tripWithGroup &&
    activityBeforeUpdate &&
    (data.title !== undefined || data.date !== undefined)
  ) {
    const allMembers = await prisma.groupMember.findMany({
      where: { groupId: tripWithGroup.groupId },
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
          type: NotificationType.activity_edited,
          title: "Activity Updated",
          message: `${user.name || user.email} updated activity '${
            activityBeforeUpdate.title
          }' in ${tripWithGroup.name}`,
          relatedGroupId: tripWithGroup.groupId,
          relatedTripId: tripId,
          relatedActivityId: activity.id,
        }).catch((err) => {
          logger.error("Failed to create notification", {
            userId: member.userId,
            error: err,
          });
        }),
      );

    await Promise.all(notificationPromises);

    // Emit Socket.IO event for real-time updates with updater info
    emitActivityUpdated(tripWithGroup.groupId, activity, {
      updatedBy: user.email || user.name || undefined,
    }).catch((err) => {
      logger.error("Failed to emit activity updated event", { error: err });
    });
  }

  logger.info("Activity updated", { activityId: activity.id, tripId });
  return activity;
}

/**
 * Deletes an activity
 */
export async function deleteActivityService(
  token: DecodedIdToken,
  tripId: string,
  activityId: string,
) {
  const { user } = await verifyTripAccess(token, tripId);

  // Get activity info before deletion
  const existingActivity = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { tripId: true, title: true },
  });

  if (!existingActivity || existingActivity.tripId !== tripId) {
    throw new Error("Activity not found or does not belong to this trip");
  }

  // Get trip with group info for notifications
  const tripWithGroup = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      group: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Notify all group members (except the deleter) BEFORE deletion
  // This ensures the notification is created before the activity is deleted
  if (tripWithGroup) {
    const allMembers = await prisma.groupMember.findMany({
      where: { groupId: tripWithGroup.groupId },
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
          type: NotificationType.activity_deleted,
          title: "Activity Deleted",
          message: `${user.name || user.email} deleted activity '${
            existingActivity.title
          }' from ${tripWithGroup.name}`,
          relatedGroupId: tripWithGroup.groupId,
          relatedTripId: tripId,
          // Don't include relatedActivityId since the activity will be deleted
        }).catch((err) => {
          logger.error("Failed to create notification", {
            userId: member.userId,
            error: err,
          });
        }),
      );

    await Promise.all(notificationPromises);
  }

  // Delete the activity
  // Notifications will have relatedActivityId set to null due to SetNull
  await prisma.activity.delete({
    where: { id: activityId },
  });

  // Emit Socket.IO event for real-time updates
  if (tripWithGroup) {
    emitActivityDeleted(tripWithGroup.groupId, activityId, {
      deletedBy: user.name || user.email,
      activityTitle: existingActivity.title,
    }).catch((err) => {
      logger.error("Failed to emit activity deleted event", { error: err });
    });
  }

  logger.info("Activity deleted", { activityId, tripId });
}
