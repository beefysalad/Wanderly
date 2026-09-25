import { NotFoundError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { deleteFirebaseUser, getFirebaseUserInfo } from "./firebase";
import {
  countUsers,
  countUsersCreatedSince,
  deleteUserAndCreatedGroups,
  findUserFirebaseId,
  listUsersWithCreationCounts,
} from "./repository";

export async function listUsersService() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [users, total, newToday] = await Promise.all([
    listUsersWithCreationCounts(),
    countUsers(),
    countUsersCreatedSince(startOfToday),
  ]);

  // Sign-in info is a nice-to-have: if Firebase is unreachable the list still loads.
  let firebaseInfo: Awaited<ReturnType<typeof getFirebaseUserInfo>> = {};
  try {
    const firebaseIds = users.map((u) => u.firebaseId).filter((id) => id && id.length > 0);
    firebaseInfo = await getFirebaseUserInfo(firebaseIds);
  } catch (fbError) {
    logger.error("Failed to fetch Firebase users", fbError);
  }

  const enhancedUsers = users.map((user) => {
    const fb = firebaseInfo[user.firebaseId];
    return {
      ...user,
      lastLoginAt: fb?.lastSignInTime || null,
      authCreationTime: fb?.creationTime || null,
      emailVerified: fb?.emailVerified ?? false,
      disabled: fb?.disabled ?? false,
      stats: {
        trips: user._count.createdTrips,
        groups: user._count.createdGroups,
      },
    };
  });

  return { users: enhancedUsers, stats: { total, newToday } };
}

/**
 * Deletes a user and the groups they created, then their Firebase account.
 * Firebase goes last: a Firebase failure leaves the user gone from the app, so it is
 * reported as a warning instead of an error.
 */
export async function deleteUserService(userId: string) {
  const user = await findUserFirebaseId(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  await deleteUserAndCreatedGroups(userId);
  logger.info(`Admin: Deleted user ${userId} and their created groups from DB`);

  if (!user.firebaseId) {
    return { success: true as const };
  }

  try {
    const result = await deleteFirebaseUser(user.firebaseId);
    if (result === "deleted") {
      logger.info(`Admin: Deleted Firebase user ${user.firebaseId}`);
    } else if (result === "not-found") {
      logger.warn(`Admin: Firebase user ${user.firebaseId} not found, skipping.`);
    }
  } catch (fbError) {
    logger.error(`Admin: Failed to delete Firebase user ${user.firebaseId}`, fbError);
    return {
      success: true as const,
      warning: "User deleted from DB but failed to remove from Firebase provider",
    };
  }

  return { success: true as const };
}
