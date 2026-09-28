import type { DecodedIdToken } from "firebase-admin/auth";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { findGroupMembership } from "../groups/repository";
import { findUserIdByFirebaseId } from "../sync/repository";
import { syncUserToDatabaseService } from "../sync/syncService";
import { findTripAccessInfo } from "./repository";

/**
 * Resolves just the caller's user id, without running the full profile sync (Firebase refresh,
 * new-account seeding, etc.) that `syncUserToDatabaseService` does. Falls back to the full sync
 * only when no row exists yet for this Firebase uid — the caller's very first request.
 */
async function resolveUserId(token: DecodedIdToken): Promise<string> {
  const existing = await findUserIdByFirebaseId(token.uid);
  if (existing) {
    return existing.id;
  }
  const user = await syncUserToDatabaseService(token);
  return user.id;
}

/**
 * Verifies the caller belongs to the trip's group. This is the hot path used by every
 * trip-scoped request (most of them reads), so it only resolves the caller's id and skips the
 * full user sync. Use `verifyTripAccessWithProfile` when the caller's name/email is also needed
 * (e.g. to compose a notification message or compare identities).
 */
export async function verifyTripAccess(token: DecodedIdToken, tripId: string) {
  const userId = await resolveUserId(token);

  const trip = await findTripAccessInfo(tripId);
  if (!trip) {
    throw new NotFoundError("Trip not found");
  }

  const membership = await findGroupMembership(trip.groupId, userId);
  if (!membership) {
    throw new ForbiddenError("User does not have access to this trip");
  }

  return { trip, user: { id: userId } };
}

/**
 * Same access check as `verifyTripAccess`, but runs the full user sync and returns the caller's
 * full profile. Use this instead of `verifyTripAccess` when the caller's name/email is needed
 * (write paths that notify other members or compare identities), not for read-only trip access.
 */
export async function verifyTripAccessWithProfile(token: DecodedIdToken, tripId: string) {
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
