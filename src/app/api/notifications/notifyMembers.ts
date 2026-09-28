import type { NotificationType } from "@prisma/client";
import { logger } from "@/lib/logger";
import { emitNotificationChangedToGroup, emitNotificationToUser } from "@/lib/socket-events";
import { listGroupMembersForNotify } from "../groups/repository";
import { createNotificationRows, findUsersFirebaseIds } from "./repository";

export interface GroupNotificationContent {
  type: NotificationType;
  title: string;
  message: string;
  relatedTripId?: string;
  relatedExpenseId?: string;
  relatedActivityId?: string;
}

/**
 * Creates the same notification for every group member except `excludeUserId`.
 *
 * The whole fan-out is batched rather than done per member: one `createMany`-style insert for
 * every recipient, one `findMany` lookup for their Firebase ids, and a single group-room ping —
 * not one of each per member. Per-user socket emits still go out individually afterwards, since
 * each member has their own private channel to be notified on.
 *
 * A DB failure is logged and turns the whole notify into a no-op; a per-user emit failure is
 * logged without affecting the others. Either way this never throws, so it never blocks the caller.
 */
export async function notifyGroupMembers(
  groupId: string,
  excludeUserId: string,
  notification: GroupNotificationContent,
) {
  const members = await listGroupMembersForNotify(groupId);
  const recipientIds = members.map((member) => member.userId).filter((id) => id !== excludeUserId);
  if (recipientIds.length === 0) {
    return;
  }

  let created;
  try {
    created = await createNotificationRows(
      recipientIds.map((userId) => ({
        userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        relatedGroupId: groupId,
        relatedTripId: notification.relatedTripId ?? null,
        relatedExpenseId: notification.relatedExpenseId ?? null,
        relatedActivityId: notification.relatedActivityId ?? null,
      })),
    );
  } catch (err) {
    logger.error("Failed to create notifications for group members", { groupId, error: err });
    return;
  }

  // One batched lookup for every recipient's Firebase id, instead of one per member.
  const recipients = await findUsersFirebaseIds(recipientIds);
  const firebaseIdByUserId = new Map(recipients.map((recipient) => [recipient.id, recipient.firebaseId]));

  await Promise.all(
    created.map((row) => {
      const firebaseId = firebaseIdByUserId.get(row.userId);
      if (!firebaseId) {
        return undefined;
      }
      return emitNotificationToUser(firebaseId, row).catch((err) => {
        logger.error("Failed to emit notification to user", { userId: row.userId, error: err });
      });
    }),
  );

  // One ping for the group's room, not one per member.
  emitNotificationChangedToGroup(groupId).catch((err) => {
    logger.error("Failed to emit notification to group", { groupId, error: err });
  });
}
