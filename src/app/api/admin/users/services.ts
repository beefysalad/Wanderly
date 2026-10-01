import { NotFoundError } from "@/src/lib/errors";
import { logger } from "@/src/lib/logger";
import { deleteFirebaseUser, getFirebaseUserInfo } from "./firebase";
import {
  countUsers,
  countUsersCreatedSince,
  deleteUserKeepingSharedData,
  findUserForDeletion,
  listUsersWithCreationCounts,
  type UserDeletionPlan,
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
 * Deletes a user, then their Firebase account, without touching what other members share
 * with them: trips, expenses, splits, payments and payment logs stay and show the user's name.
 * Each group they own goes to its longest-standing other member; groups nobody else is in are deleted.
 * Firebase goes last: a Firebase failure leaves the user gone from the app, so it is
 * reported as a warning instead of an error.
 */
export async function deleteUserService(userId: string) {
  const user = await findUserForDeletion(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  const groupTransfers: UserDeletionPlan["groupTransfers"] = [];
  const groupIdsToDelete: string[] = [];
  for (const group of user.createdGroups) {
    const [successor] = group.members
      .filter((member) => member.userId !== userId)
      .sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());
    if (successor) {
      groupTransfers.push({ groupId: group.id, newOwnerId: successor.userId });
    } else {
      groupIdsToDelete.push(group.id);
    }
  }

  await deleteUserKeepingSharedData({
    userId,
    // Same fallback the group member list uses for users without a name.
    displayName: user.name || user.email.split("@")[0],
    groupTransfers,
    groupIdsToDelete,
  });
  logger.info("Admin: Deleted user from DB", {
    userId,
    groupsHandedOver: groupTransfers.length,
    groupsDeleted: groupIdsToDelete.length,
  });

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
