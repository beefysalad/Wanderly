import { logger } from "@/lib/logger";
import { NotFoundError } from "@/lib/errors";
import {
  emitActivityCreated,
  emitActivityDeleted,
  emitActivityUpdated,
} from "@/lib/socket-events";
import { NotificationType } from "@prisma/client";
import type { DecodedIdToken } from "firebase-admin/auth";
import { notifyGroupMembers } from "../../../notifications/notifyMembers";
import { verifyTripAccess } from "../../access";
import {
  createActivityRow,
  deleteActivityRow,
  findActivityById,
  updateActivityRow,
} from "./repository";
import type { CreateActivityBody, UpdateActivityBody } from "./schemas";

async function findActivityInTrip(activityId: string, tripId: string) {
  const activity = await findActivityById(activityId);
  if (!activity || activity.tripId !== tripId) {
    throw new NotFoundError("Activity not found or does not belong to this trip");
  }
  return activity;
}

export async function createActivityService(
  token: DecodedIdToken,
  tripId: string,
  data: CreateActivityBody,
) {
  const { trip, user } = await verifyTripAccess(token, tripId);

  const activity = await createActivityRow({
    tripId,
    title: data.title,
    date: data.date,
    startTime: data.startTime || null,
    endTime: data.endTime || null,
    notes: data.notes || null,
    transportationMode: data.transportationMode || null,
    pickupTime: data.pickupTime || null,
    pickupLocation: data.pickupLocation || null,
    dropoffLocation: data.dropoffLocation || null,
  });

  await notifyGroupMembers(trip.groupId, user.id, {
    type: NotificationType.activity_added,
    title: "New Activity Added",
    message: `${user.name || user.email} added activity '${data.title}' to ${trip.name}`,
    relatedTripId: tripId,
    relatedActivityId: activity.id,
  });

  emitActivityCreated(trip.groupId, activity, {
    createdBy: user.email || user.name || undefined,
  }).catch((err) => {
    logger.error("Failed to emit activity created event", { error: err });
  });

  logger.info("Activity created", { activityId: activity.id, tripId });
  return activity;
}

export async function updateActivityService(
  token: DecodedIdToken,
  tripId: string,
  activityId: string,
  data: UpdateActivityBody,
) {
  const { trip, user } = await verifyTripAccess(token, tripId);
  const existing = await findActivityInTrip(activityId, tripId);

  const activity = await updateActivityRow(activityId, {
    ...(data.title !== undefined && { title: data.title }),
    ...(data.date !== undefined && { date: data.date }),
    ...(data.startTime !== undefined && { startTime: data.startTime || null }),
    ...(data.endTime !== undefined && { endTime: data.endTime || null }),
    ...(data.notes !== undefined && { notes: data.notes || null }),
    ...(data.done !== undefined && { done: data.done }),
    ...(data.transportationMode !== undefined && {
      transportationMode: data.transportationMode || null,
    }),
    ...(data.pickupTime !== undefined && { pickupTime: data.pickupTime || null }),
    ...(data.pickupLocation !== undefined && { pickupLocation: data.pickupLocation || null }),
    ...(data.dropoffLocation !== undefined && { dropoffLocation: data.dropoffLocation || null }),
  });

  // Only title/date changes are considered significant enough to notify or broadcast.
  if (data.title !== undefined || data.date !== undefined) {
    await notifyGroupMembers(trip.groupId, user.id, {
      type: NotificationType.activity_edited,
      title: "Activity Updated",
      message: `${user.name || user.email} updated activity '${existing.title}' in ${trip.name}`,
      relatedTripId: tripId,
      relatedActivityId: activity.id,
    });

    emitActivityUpdated(trip.groupId, activity, {
      updatedBy: user.email || user.name || undefined,
    }).catch((err) => {
      logger.error("Failed to emit activity updated event", { error: err });
    });
  }

  logger.info("Activity updated", { activityId: activity.id, tripId });
  return activity;
}

export async function deleteActivityService(
  token: DecodedIdToken,
  tripId: string,
  activityId: string,
) {
  const { trip, user } = await verifyTripAccess(token, tripId);
  const existing = await findActivityInTrip(activityId, tripId);

  // Notify BEFORE deleting; no relatedActivityId since the row is about to go.
  await notifyGroupMembers(trip.groupId, user.id, {
    type: NotificationType.activity_deleted,
    title: "Activity Deleted",
    message: `${user.name || user.email} deleted activity '${existing.title}' from ${trip.name}`,
    relatedTripId: tripId,
  });

  await deleteActivityRow(activityId);

  emitActivityDeleted(trip.groupId, activityId, {
    deletedBy: user.name || user.email,
    activityTitle: existing.title,
  }).catch((err) => {
    logger.error("Failed to emit activity deleted event", { error: err });
  });

  logger.info("Activity deleted", { activityId, tripId });
}
