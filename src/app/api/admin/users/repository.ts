import prisma from "@/lib/prisma";

export function listUsersWithCreationCounts() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { createdTrips: true, createdGroups: true } } },
  });
}

export function countUsers() {
  return prisma.user.count();
}

export function countUsersCreatedSince(since: Date) {
  return prisma.user.count({ where: { createdAt: { gte: since } } });
}

export function findUserFirebaseId(userId: string) {
  return prisma.user.findUnique({ where: { id: userId }, select: { firebaseId: true } });
}

/** Deletes the groups the user created, then the user, atomically. Related rows cascade. */
export function deleteUserAndCreatedGroups(userId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.group.deleteMany({ where: { createdById: userId } });
    await tx.user.delete({ where: { id: userId } });
  });
}
