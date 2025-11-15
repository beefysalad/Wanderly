import { AuthContext, withAuth } from "@/lib/auth/with-auth";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { joinGroupService } from "../services";
import { transformGroup } from "../transformers";

async function handler(req: NextRequest, auth: AuthContext) {
  try {
    if (req.method !== "POST") {
      return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 }
      );
    }

    const body = await req.json();
    const { groupCode } = body;

    if (!groupCode || typeof groupCode !== "string") {
      return NextResponse.json(
        { error: "Group code is required" },
        { status: 400 }
      );
    }

    const group = await joinGroupService(
      auth.decodedToken,
      groupCode.trim().toUpperCase()
    );
    const transformedGroup = transformGroup(group);

    logger.info("User joined group via API", {
      userId: auth.uid,
      groupId: group.id,
    });
    return NextResponse.json({ group: transformedGroup }, { status: 200 });
  } catch (error) {
    logger.error("Join group API error", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";

    // Handle specific errors
    if (message.includes("not found")) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    if (message.includes("already a member")) {
      return NextResponse.json(
        { error: "You are already a member of this group" },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = withAuth(handler);
