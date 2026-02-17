import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary Admin API
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(req: NextRequest) {
  try {
    const adminPassword = req.headers.get("x-admin-password");
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      users,
      groups,
      trips,
      activities,
      expenses,
      budgets,
      notifications,
      reviews,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.group.count(),
      prisma.trip.count(),
      prisma.activity.count(),
      prisma.expense.count(),
      prisma.budget.count(),
      prisma.notification.count(),
      prisma.review.count(),
    ]);

    // Get Database Size (PostgreSQL)
    let dbSize = 0;
    try {
      const result: any =
        await prisma.$queryRaw`SELECT pg_database_size(current_database()) as size`;
      dbSize = Number(result[0]?.size || 0);
    } catch (e) {
      logger.error("Admin: Failed to get db size", e);
    }

    // Get Cloudinary Usage
    let cloudinaryUsage = null;
    try {
      cloudinaryUsage = await cloudinary.api.usage();
    } catch (e) {
      logger.error("Admin: Failed to get cloudinary usage", e);
    }

    return NextResponse.json({
      stats: {
        users,
        groups,
        trips,
        activities,
        expenses,
        budgets,
        notifications,
        reviews,
      },
      usage: {
        database: {
          sizeBytes: dbSize,
        },
        cloudinary: cloudinaryUsage
          ? {
              plan: cloudinaryUsage.plan,
              storage: {
                used: cloudinaryUsage.resources?.usage || 0,
                limit: cloudinaryUsage.resources?.limit || 0,
                usedPercent:
                  (cloudinaryUsage.resources?.usage /
                    cloudinaryUsage.resources?.limit) *
                    100 || 0,
              },
              bandwidth: {
                used: cloudinaryUsage.bandwidth?.usage || 0,
                limit: cloudinaryUsage.bandwidth?.limit || 0,
                usedPercent:
                  (cloudinaryUsage.bandwidth?.usage /
                    cloudinaryUsage.bandwidth?.limit) *
                    100 || 0,
              },
              objects: {
                used: cloudinaryUsage.objects?.usage || 0,
                limit: cloudinaryUsage.objects?.limit || 0,
                usedPercent:
                  (cloudinaryUsage.objects?.usage /
                    cloudinaryUsage.objects?.limit) *
                    100 || 0,
              },
            }
          : null,
      },
    });
  } catch (error) {
    logger.error("Admin: Failed to fetch db stats", error);
    return NextResponse.json(
      { error: "Failed to fetch database statistics" },
      { status: 500 },
    );
  }
}
