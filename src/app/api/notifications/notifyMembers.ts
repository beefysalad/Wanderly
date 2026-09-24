import { logger } from "@/lib/logger";
import { listGroupMembersForNotify } from "../groups/repository";
import { createNotificationService } from "./services";

type NotificationInput = Parameters<typeof createNotificationService>[1];

/**
 * Creates the same notification for every group member except `excludeUserId`.
 * A failure for one member is logged and never blocks the others or the caller.
 */
export async function notifyGroupMembers(
  groupId: string,
  excludeUserId: string,
  notification: Omit<NotificationInput, "relatedGroupId">,
) {
  const members = await listGroupMembersForNotify(groupId);
  await Promise.all(
    members
      .filter((member) => member.userId !== excludeUserId)
      .map((member) =>
        createNotificationService(member.userId, {
          ...notification,
          relatedGroupId: groupId,
        }).catch((err) => {
          logger.error("Failed to create notification", { userId: member.userId, error: err });
        }),
      ),
  );
}
