import { NotFoundError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { emitNotificationToGroup, emitNotificationToUser } from "@/lib/socket-events";
import type { NotificationType } from "@prisma/client";
import type { DecodedIdToken } from "firebase-admin/auth";
import { syncUserToDatabaseService } from "../sync/syncService";
import {
  countUnreadNotifications,
  createNotificationRow,
  findNotificationById,
  findUserFirebaseId,
  listNotificationsByUser,
  markAllNotificationsRead,
  markNotificationRead,
} from "./repository";
import type { ListNotificationsQuery } from "./schemas";

export async function createNotificationService(
  userId: string,
  data: {
    type: NotificationType;
    title: string;
    message: string;
    relatedGroupId?: string;
    relatedTripId?: string;
    relatedExpenseId?: string;
    relatedActivityId?: string;
  },
) {
  const notification = await createNotificationRow({
    userId,
    type: data.type,
    title: data.title,
    message: data.message,
    relatedGroupId: data.relatedGroupId || null,
    relatedTripId: data.relatedTripId || null,
    relatedExpenseId: data.relatedExpenseId || null,
    relatedActivityId: data.relatedActivityId || null,
  });

  // Real-time delivery is best-effort: a socket failure never fails the creation.
  const user = await findUserFirebaseId(userId);
  if (user?.firebaseId) {
    emitNotificationToUser(user.firebaseId, notification).catch((err) => {
      logger.error("Failed to emit notification to user", { error: err });
    });
  }

  if (data.relatedGroupId) {
    emitNotificationToGroup(data.relatedGroupId, notification).catch((err) => {
      logger.error("Failed to emit notification to group", { error: err });
    });
  }

  logger.info("Notification created", {
    notificationId: notification.id,
    userId,
    type: data.type,
  });

  return notification;
}

export async function listNotificationsService(token: DecodedIdToken, query: ListNotificationsQuery) {
  const user = await syncUserToDatabaseService(token);

  const { notifications, total } = await listNotificationsByUser(user.id, query);

  return {
    notifications,
    total,
    hasMore: query.offset + notifications.length < total,
  };
}

export async function markNotificationReadService(token: DecodedIdToken, notificationId: string) {
  const user = await syncUserToDatabaseService(token);

  // Someone else's notification is reported as missing rather than confirming it exists.
  const notification = await findNotificationById(notificationId);
  if (!notification || notification.userId !== user.id) {
    throw new NotFoundError("Notification not found");
  }

  if (notification.read) {
    return notification;
  }

  const updated = await markNotificationRead(notificationId);

  logger.info("Notification marked as read", { notificationId, userId: user.id });

  return updated;
}

export async function markAllNotificationsReadService(token: DecodedIdToken) {
  const user = await syncUserToDatabaseService(token);

  const result = await markAllNotificationsRead(user.id);

  logger.info("All notifications marked as read", { userId: user.id, count: result.count });

  return result;
}

export async function getUnreadCountService(token: DecodedIdToken) {
  const user = await syncUserToDatabaseService(token);

  return { count: await countUnreadNotifications(user.id) };
}
