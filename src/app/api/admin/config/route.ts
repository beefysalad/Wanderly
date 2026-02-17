import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

import { verifyAdminPassword } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    const adminPassword = req.headers.get("x-admin-password");
    if (!(await verifyAdminPassword(adminPassword))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const configs = await prisma.appConfig.findMany({
      orderBy: { key: "asc" },
    });

    return NextResponse.json({ configs });
  } catch (error) {
    logger.error("Admin: Failed to fetch configs", error);
    return NextResponse.json(
      { error: "Failed to fetch configurations" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminPassword = req.headers.get("x-admin-password");
    if (!(await verifyAdminPassword(adminPassword))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { key, value } = await req.json();

    if (!key) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    const config = await prisma.appConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    logger.info("Admin: Updated app config", { key });

    return NextResponse.json({ success: true, config });
  } catch (error) {
    logger.error("Admin: Failed to update config", error);
    return NextResponse.json(
      { error: "Failed to update configuration" },
      { status: 500 },
    );
  }
}
