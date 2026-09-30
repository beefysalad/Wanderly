import prisma from "@/src/lib/prisma";
import type { NotificationType } from "@prisma/client";

export interface CreateNotificationRow {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedGroupId: string | null;
  relatedTripId: string | null;
  relatedExpenseId: string | null;
  relatedActivityId: string | null;
}

export function createNotificationRow(data: CreateNotificationRow) {
  return prisma.notification.create({ data });
}

/** Batched insert for a group-notification fan-out: one round trip for every recipient. */
export function createNotificationRows(data: CreateNotificationRow[]) {
  return prisma.notification.createManyAndReturn({ data });
}

export function findUserFirebaseId(userId: string) {
  return prisma.user.findUnique({ where: { id: userId }, select: { firebaseId: true } });
}

/** Batched lookup for a group-notification fan-out: one round trip instead of one per recipient. */
export function findUsersFirebaseIds(userIds: string[]) {
  return prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, firebaseId: true },
  });
}

export async function listNotificationsByUser(
  userId: string,
  options: { limit: number; offset: number; read?: boolean },
) {
  const where = { userId, ...(options.read !== undefined && { read: options.read }) };

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: options.limit,
      skip: options.offset,
    }),
    prisma.notification.count({ where }),
  ]);

  return { notifications, total };
}

export function findNotificationById(notificationId: string) {
  return prisma.notification.findUnique({ where: { id: notificationId } });
}

export function markNotificationRead(notificationId: string) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true, readAt: new Date() },
  });
}

export function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true, readAt: new Date() },
  });
}

export function countUnreadNotifications(userId: string) {
  return prisma.notification.count({ where: { userId, read: false } });
}
