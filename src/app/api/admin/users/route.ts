import { userAuth } from "@/lib/firebase-admin";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const adminPassword = req.headers.get("x-admin-password");
    if (!(await verifyAdminPassword(adminPassword))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch users and stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [users, totalUsers, newUsersToday] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              createdTrips: true,
              createdGroups: true,
            },
          },
        },
      }),
      prisma.user.count(),
      prisma.user.count({
        where: {
          createdAt: {
            gte: today,
          },
        },
      }),
    ]);

    // 2. Fetch Firebase user records to get lastSignInTime
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const firebaseUsersMap: Record<string, any> = {};
    if (userAuth && users.length > 0) {
      try {
        const firebaseIds = users
          .map((u) => u.firebaseId)
          .filter((id) => id && id.length > 0);

        const chunks = [];
        for (let i = 0; i < firebaseIds.length; i += 100) {
          chunks.push(firebaseIds.slice(i, i + 100));
        }

        for (const chunk of chunks) {
          const result = await userAuth.getUsers(chunk.map((uid) => ({ uid })));
          result.users.forEach((fbUser) => {
            firebaseUsersMap[fbUser.uid] = {
              lastSignInTime: fbUser.metadata.lastSignInTime,
              creationTime: fbUser.metadata.creationTime,
              emailVerified: fbUser.emailVerified,
              disabled: fbUser.disabled,
            };
          });
        }
      } catch (fbError) {
        logger.error("Failed to fetch Firebase users", fbError);
      }
    }

    // 3. Merge data
    const enhancedUsers = users.map((user) => {
      const fbData = firebaseUsersMap[user.firebaseId] || {};
      return {
        ...user,
        lastLoginAt: fbData.lastSignInTime || null,
        authCreationTime: fbData.creationTime || null,
        emailVerified: fbData.emailVerified ?? false,
        disabled: fbData.disabled ?? false,
        stats: {
          trips: user._count.createdTrips,
          groups: user._count.createdGroups,
        },
      };
    });

    return NextResponse.json({
      users: enhancedUsers,
      stats: {
        total: totalUsers,
        newToday: newUsersToday,
      },
    });
  } catch (error) {
    logger.error("Admin: Failed to fetch users", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
