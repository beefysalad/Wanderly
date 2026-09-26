import type { DecodedIdToken } from "firebase-admin/auth";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { findGroupMembership } from "../groups/repository";
import { syncUserToDatabaseService } from "../sync/syncService";
import { findTripAccessInfo } from "./repository";

export async function verifyTripAccess(token: DecodedIdToken, tripId: string) {
  const user = await syncUserToDatabaseService(token);

  const trip = await findTripAccessInfo(tripId);
  if (!trip) {
    throw new NotFoundError("Trip not found");
  }

  const membership = await findGroupMembership(trip.groupId, user.id);
  if (!membership) {
    throw new ForbiddenError("User does not have access to this trip");
  }

  return { trip, user };
}

// The guest's token proves which group they validated; make sure that is the trip's group.
export async function verifyGuestTripAccess(guestGroupId: string, tripId: string) {
  const trip = await findTripAccessInfo(tripId);
  if (!trip) {
    throw new NotFoundError("Trip not found");
  }
  if (trip.groupId !== guestGroupId) {
    throw new ForbiddenError("Invalid guest access");
  }
  return { trip: { id: trip.id, groupId: trip.groupId } };
}
