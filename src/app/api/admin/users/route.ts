import { userAuth } from "@/lib/firebase-admin";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const adminPassword = req.headers.get("x-admin-password");
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
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
    let firebaseUsersMap: Record<string, any> = {};
    if (userAuth && users.length > 0) {
      try {
        const firebaseIds = users
          .map((u) => u.firebaseId)
          .filter((id) => id && id.length > 0);

        // Firebase listUsers API might be better if we want ALL,
        // but getUsers is better for specific IDs.
        // Since we have the IDs from Prisma, we'll use getUsers which accepts up to 100 at a time.
        // For now, let's just do it in chunks of 100.

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
        // Continue without firebase data if it fails
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
