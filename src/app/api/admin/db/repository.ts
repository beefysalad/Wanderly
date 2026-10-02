import prisma from "@/src/lib/prisma";

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
