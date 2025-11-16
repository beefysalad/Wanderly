import { AuthContext, withAuth } from "@/lib/auth/with-auth";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { deleteGroupService, getGroupByIdService, updateGroupService } from "../services";
import { transformGroup } from "../transformers";

async function handler(req: NextRequest, auth: AuthContext) {
  try {
    // Extract groupId from URL path: /api/groups/[groupId]
    const pathParts = req.nextUrl.pathname.split("/");
    const groupId = pathParts[pathParts.length - 1];

    if (!groupId) {
      return NextResponse.json(
        { error: "Group ID is required" },
        { status: 400 }
      );
    }

    if (req.method === "GET") {
      const group = await getGroupByIdService(auth.decodedToken, groupId);
      const transformedGroup = transformGroup(group);

      return NextResponse.json({ group: transformedGroup });
    } else if (req.method === "PATCH") {
      const body = await req.json();
      const { name, colorScheme, emoji } = body;

      const updates: {
        name?: string;
        colorScheme?: string;
        emoji?: string | null;
      } = {};

      if (name !== undefined) {
        updates.name = name;
      }
      if (colorScheme !== undefined) {
        updates.colorScheme = colorScheme;
      }
      if (emoji !== undefined) {
        updates.emoji = emoji;
      }

      const group = await updateGroupService(auth.decodedToken, groupId, updates);
      const transformedGroup = transformGroup(group);

      logger.info("Group updated via API", { groupId });
      return NextResponse.json({ group: transformedGroup });
    } else if (req.method === "DELETE") {
      await deleteGroupService(auth.decodedToken, groupId);

      logger.info("Group deleted via API", { groupId });
      return NextResponse.json(
        { message: "Group deleted successfully" },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 }
      );
    }
  } catch (error) {
    logger.error("Group API error", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (
      message.includes("not found") ||
      message.includes("not a member") ||
      message.includes("Only the group creator")
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withAuth(handler);
export const PATCH = withAuth(handler);
export const DELETE = withAuth(handler);
