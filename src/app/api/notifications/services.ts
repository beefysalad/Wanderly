import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { syncUserToDatabaseService } from "../sync/syncService";
import type { DecodedIdToken } from "firebase-admin/auth";
import { NotificationType } from "@prisma/client";
import {
  emitNotificationToUser,
  emitNotificationToGroup,
} from "@/lib/socket-events";

/**
 * Gets or creates a user in the database from Firebase token
 */
async function getOrCreateUser(token: DecodedIdToken) {
  return await syncUserToDatabaseService(token);
}

/**
 * Creates a notification for a user
 */
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
  }
) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type: data.type,
      title: data.title,
      message: data.message,
      relatedGroupId: data.relatedGroupId || null,
      relatedTripId: data.relatedTripId || null,
      relatedExpenseId: data.relatedExpenseId || null,
      relatedActivityId: data.relatedActivityId || null,
    },
  });

  // Get user's Firebase ID for Socket.IO emission
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firebaseId: true },
  });

  // Emit Socket.IO event to the user's room
  if (user?.firebaseId) {
    emitNotificationToUser(user.firebaseId, notification).catch((err) => {
      logger.error("Failed to emit notification to user", { error: err });
    });
  }

  // Also emit to group room if this is a group-related notification
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

/**
 * Lists notifications for a user with pagination
 */
export async function listNotificationsService(
  token: DecodedIdToken,
  options?: {
    limit?: number;
    offset?: number;
    read?: boolean;
  }
) {
  const user = await getOrCreateUser(token);

  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  const where: {
    userId: string;
    read?: boolean;
  } = {
    userId: user.id,
  };

  if (options?.read !== undefined) {
    where.read = options.read;
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications,
    total,
    hasMore: offset + notifications.length < total,
  };
}

/**
 * Marks a notification as read
 */
export async function markNotificationReadService(
  token: DecodedIdToken,
  notificationId: string
) {
  const user = await getOrCreateUser(token);

  // Verify notification belongs to user
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { userId: true, read: true },
  });

  if (!notification) {
    throw new Error("Notification not found");
  }

  if (notification.userId !== user.id) {
    throw new Error("Notification does not belong to user");
  }

  if (notification.read) {
    return notification;
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: {
      read: true,
      readAt: new Date(),
    },
  });

  logger.info("Notification marked as read", {
    notificationId,
    userId: user.id,
  });

  return updated;
}

/**
 * Marks all notifications as read for a user
 */
export async function markAllNotificationsReadService(
  token: DecodedIdToken
) {
  const user = await getOrCreateUser(token);

  const result = await prisma.notification.updateMany({
    where: {
      userId: user.id,
      read: false,
    },
    data: {
      read: true,
      readAt: new Date(),
    },
  });

  logger.info("All notifications marked as read", {
    userId: user.id,
    count: result.count,
  });

  return result;
}

/**
 * Gets the count of unread notifications for a user
 */
export async function getUnreadCountService(token: DecodedIdToken) {
  const user = await getOrCreateUser(token);

  const count = await prisma.notification.count({
    where: {
      userId: user.id,
      read: false,
    },
  });

  return { count };
}

