import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";

/**
 * POST /api/groups/validate-code
 * Validates a group code and returns the groupId
 * No authentication required
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Group code is required" },
        { status: 400 }
      );
    }

    // Find group by code (convert to uppercase to match database)
    const group = await prisma.group.findUnique({
      where: { code: code.trim().toUpperCase() },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    logger.info("Group code validated", { groupId: group.id, code: group.code });

    return NextResponse.json({
      groupId: group.id,
      groupName: group.name,
      code: group.code,
    });
  } catch (error) {
    logger.error("Error validating group code", error);
    return NextResponse.json(
      { error: "Failed to validate group code" },
      { status: 500 }
    );
  }
}

