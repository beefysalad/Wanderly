import { logger } from "@/src/lib/logger";
import { NotFoundError, ValidationError } from "@/src/lib/errors";
import {
  emitActivityCreated,
  emitActivityDeleted,
  emitActivityUpdated,
} from "@/src/lib/socket-events";
import { NotificationType } from "@prisma/client";
import type { DecodedIdToken } from "firebase-admin/auth";
import { notifyGroupMembers } from "../../../notifications/notifyMembers";
import { verifyTripAccessWithProfile } from "../../access";
import {
  createActivityRow,
  deleteActivityRow,
  findActivityById,
  updateActivityRow,
} from "./repository";
import {
  TIME_ORDER_MESSAGE,
  timesInOrder,
  type CreateActivityBody,
  type UpdateActivityBody,
} from "./schemas";

async function findActivityInTrip(activityId: string, tripId: string) {
  const activity = await findActivityById(activityId);
  if (!activity || activity.tripId !== tripId) {
    throw new NotFoundError("Activity not found or does not belong to this trip");
  }
  return activity;
}

/**
 * Trip and activity dates are picked as a calendar day and sent as "YYYY-MM-DD", which is stored as
 * UTC midnight, so the UTC day is the day that was picked. Comparing those days (not instants)
 * keeps the trip's last day inclusive and ignores any time a legacy row was saved with.
 */
const pickedDay = (date: Date) => date.toISOString().slice(0, 10);

function assertWithinTrip(date: Date, trip: { startDate: Date; endDate: Date }) {
  const day = pickedDay(date);
  const first = pickedDay(trip.startDate);
  const last = pickedDay(trip.endDate);
  if (day < first || day > last) {
    throw new ValidationError(`Pick a date within the trip (${first} to ${last})`);
  }
}

export async function createActivityService(
  token: DecodedIdToken,
  tripId: string,
  data: CreateActivityBody,
) {
  const { trip, user } = await verifyTripAccessWithProfile(token, tripId);
  assertWithinTrip(data.date, trip);

  const activity = await createActivityRow({
    tripId,
    title: data.title,
    date: data.date,
    startTime: data.startTime || null,
    endTime: data.endTime || null,
    location: data.location || null,
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
  const { trip, user } = await verifyTripAccessWithProfile(token, tripId);
  const existing = await findActivityInTrip(activityId, tripId);

  // Only a move is checked: an activity the trip's new dates left outside stays editable in place.
  if (data.date !== undefined && pickedDay(data.date) !== pickedDay(existing.date)) {
    assertWithinTrip(data.date, trip);
  }
  // Times are checked only when one is sent (a time sent alone against the stored other one), so
  // legacy rows with out-of-order times can still be ticked done or renamed.
  if (data.startTime !== undefined || data.endTime !== undefined) {
    const startTime = data.startTime !== undefined ? data.startTime : existing.startTime;
    const endTime = data.endTime !== undefined ? data.endTime : existing.endTime;
    if (!timesInOrder(startTime, endTime)) {
      throw new ValidationError(TIME_ORDER_MESSAGE);
    }
  }

  const activity = await updateActivityRow(activityId, {
    ...(data.title !== undefined && { title: data.title }),
    ...(data.date !== undefined && { date: data.date }),
    ...(data.startTime !== undefined && { startTime: data.startTime || null }),
    ...(data.endTime !== undefined && { endTime: data.endTime || null }),
    ...(data.location !== undefined && { location: data.location || null }),
    ...(data.notes !== undefined && { notes: data.notes || null }),
    ...(data.done !== undefined && { done: data.done }),
    ...(data.transportationMode !== undefined && {
      transportationMode: data.transportationMode || null,
    }),
    ...(data.pickupTime !== undefined && { pickupTime: data.pickupTime || null }),
    ...(data.pickupLocation !== undefined && { pickupLocation: data.pickupLocation || null }),
    ...(data.dropoffLocation !== undefined && { dropoffLocation: data.dropoffLocation || null }),
  });

  // Only title/date changes are considered significant enough to notify; every change is
  // still broadcast so other clients stay in sync (split/date/time/notes edits included).
  if (data.title !== undefined || data.date !== undefined) {
    await notifyGroupMembers(trip.groupId, user.id, {
      type: NotificationType.activity_edited,
      title: "Activity Updated",
      message: `${user.name || user.email} updated activity '${existing.title}' in ${trip.name}`,
      relatedTripId: tripId,
      relatedActivityId: activity.id,
    });
  }

  emitActivityUpdated(trip.groupId, activity, {
    updatedBy: user.email || user.name || undefined,
  }).catch((err) => {
    logger.error("Failed to emit activity updated event", { error: err });
  });

  logger.info("Activity updated", { activityId: activity.id, tripId });
  return activity;
}

export async function deleteActivityService(
  token: DecodedIdToken,
  tripId: string,
  activityId: string,
) {
  const { trip, user } = await verifyTripAccessWithProfile(token, tripId);
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
