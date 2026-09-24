import { logger } from "@/lib/logger";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import type { DecodedIdToken } from "firebase-admin/auth";
import { NotificationType, type TripStatus } from "@prisma/client";
import { syncUserToDatabaseService } from "../../../sync/syncService";
import { createNotificationService } from "../../../notifications/services";
import {
  findGroupMembership,
  findGroupOwnership,
  listGroupMembersForNotify,
} from "../../repository";
import { createTripRow, deleteTripRow, findTripById, updateTripRow } from "./repository";
import { emitTripCreated, emitTripDeleted, emitTripUpdated } from "@/lib/socket-events";
import type { CreateTripBody, UpdateTripBody } from "./schemas";

async function getOrCreateUser(token: DecodedIdToken) {
  return syncUserToDatabaseService(token);
}

async function verifyGroupMembership(token: DecodedIdToken, groupId: string) {
  const user = await getOrCreateUser(token);

  const membership = await findGroupMembership(groupId, user.id);
  if (!membership) {
    throw new ForbiddenError("User is not a member of this group");
  }

  const group = await findGroupOwnership(groupId);
  if (!group) {
    throw new NotFoundError("Group not found");
  }

  return { user, group };
}

async function verifyTripInGroup(groupId: string, tripId: string) {
  const trip = await findTripById(tripId);
  if (!trip) {
    throw new NotFoundError("Trip not found");
  }
  if (trip.groupId !== groupId) {
    // Same message as the missing-trip case so callers can't probe whether an
    // ID exists in some other group.
    throw new NotFoundError("Trip not found");
  }
  return trip;
}

export async function createTripService(
  token: DecodedIdToken,
  groupId: string,
  data: CreateTripBody,
) {
  const { user, group } = await verifyGroupMembership(token, groupId);

  const trip = await createTripRow({
    groupId,
    createdById: user.id,
    name: data.tripName,
    startDate: data.startDate,
    endDate: data.endDate,
    location: data.location || null,
    status: data.status as TripStatus,
  });

  const allMembers = await listGroupMembersForNotify(groupId);
  const notificationPromises = allMembers
    .filter((member) => member.userId !== user.id)
    .map((member) =>
      createNotificationService(member.userId, {
        type: NotificationType.trip_created,
        title: "New Trip Created",
        message: `${user.name || user.email} created trip '${data.tripName}' in ${group.name}`,
        relatedGroupId: groupId,
        relatedTripId: trip.id,
      }).catch((err) => {
        logger.error("Failed to create notification", { userId: member.userId, error: err });
      }),
    );
  await Promise.all(notificationPromises);

  emitTripCreated(groupId, trip).catch((err) => {
    logger.error("Failed to emit trip created event", { error: err });
  });

  logger.info("Trip created", { tripId: trip.id, groupId });
  return trip;
}

export async function updateTripService(
  token: DecodedIdToken,
  groupId: string,
  tripId: string,
  updates: UpdateTripBody,
) {
  await verifyGroupMembership(token, groupId);
  await verifyTripInGroup(groupId, tripId);

  const trip = await updateTripRow(tripId, {
    ...(updates.name !== undefined && { name: updates.name }),
    ...(updates.startDate !== undefined && { startDate: updates.startDate }),
    ...(updates.endDate !== undefined && { endDate: updates.endDate }),
    ...(updates.location !== undefined && { location: updates.location || null }),
    ...(updates.status !== undefined && { status: updates.status as TripStatus }),
  });

  emitTripUpdated(groupId, trip).catch((err) => {
    logger.error("Failed to emit trip updated event", { error: err });
  });

  logger.info("Trip updated", { tripId, groupId });
  return trip;
}

export async function deleteTripService(
  token: DecodedIdToken,
  groupId: string,
  tripId: string,
) {
  const { user, group } = await verifyGroupMembership(token, groupId);
  const trip = await verifyTripInGroup(groupId, tripId);

  if (trip.createdById !== user.id) {
    throw new ForbiddenError("Only the trip creator can delete this trip");
  }

  const allMembers = await listGroupMembersForNotify(groupId);

  // Notify remaining members BEFORE deletion, per the original code's ordering.
  const notificationPromises = allMembers
    .filter((member) => member.userId !== user.id)
    .map((member) =>
      createNotificationService(member.userId, {
        type: NotificationType.trip_deleted,
        title: "Trip Deleted",
        message: `${user.name || user.email} deleted trip '${trip.name}' from ${group.name}`,
        relatedGroupId: groupId,
      }).catch((err) => {
        logger.error("Failed to create notification", { userId: member.userId, error: err });
      }),
    );
  await Promise.all(notificationPromises);

  await deleteTripRow(tripId);

  emitTripDeleted(groupId, tripId, {
    deletedBy: user.name || user.email,
    tripName: trip.name,
  }).catch((err) => {
    logger.error("Failed to emit trip deleted event", { error: err });
  });

  logger.info("Trip deleted", { tripId, groupId });
}
