import { AuthContext, withAuth } from "@/lib/auth/with-auth";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getGroupByIdService } from "../services";
import { transformGroup } from "../transformers";

async function handler(req: NextRequest, auth: AuthContext) {
  try {
    if (req.method !== "GET") {
      return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 }
      );
    }

    // Extract groupId from URL path: /api/groups/[groupId]
    const pathParts = req.nextUrl.pathname.split("/");
    const groupId = pathParts[pathParts.length - 1];

    if (!groupId) {
      return NextResponse.json(
        { error: "Group ID is required" },
        { status: 400 }
      );
    }

    const group = await getGroupByIdService(auth.decodedToken, groupId);
    const transformedGroup = transformGroup(group);

    return NextResponse.json({ group: transformedGroup });
  } catch (error) {
    logger.error("Get group API error", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (message.includes("not a member") || message.includes("not found")) {
      return NextResponse.json(
        { error: "Group not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withAuth(handler);
