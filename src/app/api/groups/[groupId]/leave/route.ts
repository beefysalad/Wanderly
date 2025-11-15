import { AuthContext, withAuth } from "@/lib/auth/with-auth";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { leaveGroupService } from "../../services";

async function handler(req: NextRequest, auth: AuthContext) {
  try {
    if (req.method !== "POST") {
      return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 }
      );
    }

    // Extract groupId from URL path: /api/groups/[groupId]/leave
    const pathParts = req.nextUrl.pathname.split("/");
    const groupIdIndex = pathParts.indexOf("groups");
    const groupId = pathParts[groupIdIndex + 1];

    if (!groupId || groupId === "leave") {
      return NextResponse.json(
        { error: "Group ID is required" },
        { status: 400 }
      );
    }

    await leaveGroupService(auth.decodedToken, groupId);

    logger.info("User left group via API", { groupId });
    return NextResponse.json(
      { message: "Successfully left group" },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Leave group API error", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (
      message.includes("not found") ||
      message.includes("not a member") ||
      message.includes("cannot leave")
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = withAuth(handler);

