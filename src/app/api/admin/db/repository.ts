import prisma from "@/lib/prisma";

export async function countAllEntities() {
  const [users, groups, trips, activities, expenses, budgets, notifications, reviews] =
    await Promise.all([
      prisma.user.count(),
      prisma.group.count(),
      prisma.trip.count(),
      prisma.activity.count(),
      prisma.expense.count(),
      prisma.budget.count(),
      prisma.notification.count(),
      prisma.review.count(),
    ]);

  return { users, groups, trips, activities, expenses, budgets, notifications, reviews };
}

/** Size of the current PostgreSQL database in bytes. */
export async function getDatabaseSizeBytes() {
  const result = await prisma.$queryRaw<{ size: bigint | number | string | null }[]>`
    SELECT pg_database_size(current_database()) as size`;
  return Number(result[0]?.size || 0);
}

export async function findSeededTestUserIds() {
  const users = await prisma.user.findMany({
    where: { hasSeededTestData: true },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

/**
 * Removes the "(sample)" groups and trips created by the given test users in one transaction
 * (deleting a group cascades to its trips, members, expenses, ...). Users keep the
 * hasSeededTestData flag so they aren't re-seeded.
 */
export function deleteSampleData(testUserIds: string[]) {
  return prisma.$transaction(async (tx) => {
    const groupResult = await tx.group.deleteMany({
      where: { createdById: { in: testUserIds }, name: { contains: "(sample)" } },
    });

    // Any orphaned sample trips whose group survived.
    const tripResult = await tx.trip.deleteMany({
      where: { createdById: { in: testUserIds }, name: { contains: "(sample)" } },
    });

    await tx.user.updateMany({
      where: { id: { in: testUserIds } },
      data: { hasSeededTestData: true },
    });

    return { groups: groupResult.count, trips: tripResult.count };
  });
}
