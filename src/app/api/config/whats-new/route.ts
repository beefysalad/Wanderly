import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
  CURRENT_WHATS_NEW_VERSION,
  WHATS_NEW_FEATURES,
} from "@/src/app/config/whats-new";

const CONFIG_KEY = "whats-new";

export async function GET() {
  try {
    const config = await prisma.appConfig.findUnique({
      where: { key: CONFIG_KEY },
    });

    if (!config) {
      return NextResponse.json({
        version: CURRENT_WHATS_NEW_VERSION,
        features: WHATS_NEW_FEATURES,
      });
    }

    return NextResponse.json(config.value);
  } catch (error) {
    logger.error("Failed to fetch whats-new config", error);
    return NextResponse.json(
      { error: "Failed to fetch configuration" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminPassword = req.headers.get("x-admin-password");
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { version, features } = body;

    if (!version || !Array.isArray(features)) {
      return NextResponse.json(
        { error: "Invalid configuration data" },
        { status: 400 },
      );
    }

    const config = await prisma.appConfig.upsert({
      where: { key: CONFIG_KEY },
      update: {
        value: { version, features },
      },
      create: {
        key: CONFIG_KEY,
        value: { version, features },
      },
    });

    logger.info("Whats-new configuration updated by admin");

    return NextResponse.json({ success: true, config });
  } catch (error) {
    logger.error("Failed to update whats-new config", error);
    return NextResponse.json(
      { error: "Failed to update configuration" },
      { status: 500 },
    );
  }
}
