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

/** What deleting a user needs: their Firebase uid, their name, and the members of every group they own. */
export function findUserForDeletion(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      firebaseId: true,
      name: true,
      email: true,
      createdGroups: {
        select: { id: true, members: { select: { userId: true, joinedAt: true } } },
      },
    },
  });
}

export interface UserDeletionPlan {
  userId: string;
  /** Written onto the rows other members keep: splits, payments, payment logs and expenses the user paid. */
  displayName: string;
  /** Owned groups handed to another member, who also becomes a group admin. */
  groupTransfers: { groupId: string; newOwnerId: string }[];
  /** Owned groups nobody else is in. */
  groupIdsToDelete: string[];
}

/**
 * Applies a deletion plan atomically. The foreign keys null out the user on shared rows
 * (trips, splits, payments, payment logs, expenses), so the name is copied onto them first.
 * The user's memberships and notifications cascade.
 */
export function deleteUserKeepingSharedData(plan: UserDeletionPlan) {
  const { userId, displayName } = plan;

  return prisma.$transaction(async (tx) => {
    await tx.expenseSplit.updateMany({ where: { userId }, data: { tempName: displayName } });
    await tx.expensePayment.updateMany({ where: { userId }, data: { tempName: displayName } });
    await tx.expense.updateMany({ where: { paidById: userId }, data: { tempPaidBy: displayName } });
    await tx.paymentLog.updateMany({ where: { payerId: userId }, data: { payerName: displayName } });
    await tx.paymentLog.updateMany({ where: { payeeId: userId }, data: { payeeName: displayName } });

    for (const { groupId, newOwnerId } of plan.groupTransfers) {
      await tx.group.update({ where: { id: groupId }, data: { createdById: newOwnerId } });
      // Throws (and rolls everything back) if the new owner left the group in the meantime.
      await tx.groupMember.update({
        where: { groupId_userId: { groupId, userId: newOwnerId } },
        data: { role: "admin" },
      });
    }
    await tx.group.deleteMany({ where: { id: { in: plan.groupIdsToDelete } } });

    await tx.user.delete({ where: { id: userId } });
  });
}
