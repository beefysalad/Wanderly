import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { withOptionalAuth, type OptionalAuthContext } from "@/lib/auth/with-auth";
import { getGroupByIdForGuestService } from "../../services";
import { transformGroup } from "../../transformers";

/**
 * GET /api/groups/[groupId]/guest
 * Returns group data for guest access (requires X-Guest-Code header)
 */
async function handler(
  req: NextRequest,
  context: OptionalAuthContext
): Promise<NextResponse> {
  try {
    // Extract groupId from URL
    const pathParts = req.nextUrl.pathname.split("/");
    const groupId = pathParts[pathParts.indexOf("groups") + 1];

    if (!groupId) {
      return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
    }

    // Verify guest access
    if (!context.isGuest || !context.groupCode) {
      return NextResponse.json(
        { error: "Guest access required" },
        { status: 403 }
      );
    }

    // Get group data
    const prismaGroup = await getGroupByIdForGuestService(
      context.groupCode,
      groupId
    );

    // Transform to frontend format
    const group = transformGroup(prismaGroup);

    return NextResponse.json(group);
  } catch (error) {
    logger.error("Error fetching group for guest", error);

    if (error instanceof Error) {
      if (error.message === "Group not found") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message === "Invalid group code") {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: "Failed to fetch group" },
      { status: 500 }
    );
  }
}

// Wrap with optional auth
export const GET = withOptionalAuth(handler);

