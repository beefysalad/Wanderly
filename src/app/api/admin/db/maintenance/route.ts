import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

import { verifyAdminPassword } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  try {
    const adminPassword = req.headers.get("x-admin-password");
    if (!(await verifyAdminPassword(adminPassword))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await req.json();

    if (action === "clean-test-data") {
      // Find users marked with test data
      const testUsers = await prisma.user.findMany({
        where: { hasSeededTestData: true },
        select: { id: true },
      });

      if (testUsers.length === 0) {
        return NextResponse.json({ message: "No test data found to clean" });
      }

      const testUserIds = testUsers.map((u) => u.id);

      // Perform cleanup in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // 1. Delete groups with (sample) in name created by test users
        // This will cascade to trips, members, expenses, etc.
        const groupResult = await tx.group.deleteMany({
          where: {
            createdById: { in: testUserIds },
            name: { contains: "(sample)" },
          },
        });

        // 2. Delete any orphaned trips with (sample) in name created by test users
        const tripResult = await tx.trip.deleteMany({
          where: {
            createdById: { in: testUserIds },
            name: { contains: "(sample)" },
          },
        });

        // 3. Keep/Set the flag on users to true so they don't auto-re-seed
        await tx.user.updateMany({
          where: { id: { in: testUserIds } },
          data: { hasSeededTestData: true },
        });

        return { groups: groupResult.count, trips: tripResult.count };
      });

      logger.info("Admin: Cleaned test data", {
        usersAffected: testUserIds.length,
        groupsDeleted: result.groups,
        tripsDeleted: result.trips,
      });

      return NextResponse.json({
        success: true,
        message: `Cleaned ${result.groups} sample groups and ${result.trips} sample trips for ${testUserIds.length} users.`,
        count: result.groups + result.trips,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    logger.error("Admin: Database maintenance failed", error);
    return NextResponse.json(
      { error: "Maintenance task failed" },
      { status: 500 },
    );
  }
}
