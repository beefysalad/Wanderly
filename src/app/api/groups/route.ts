import { AuthContext, withAuth } from "@/lib/auth/with-auth";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { createGroupService, listGroupsService } from "./services";
import { transformGroup } from "./transformers";

async function handler(req: NextRequest, auth: AuthContext) {
  try {
    if (req.method === "GET") {
      // List user's groups
      const groups = await listGroupsService(auth.decodedToken);
      const transformedGroups = groups.map(transformGroup);
      return NextResponse.json({ groups: transformedGroups });
    }

    if (req.method === "POST") {
      // Create new group
      const body = await req.json();
      const { name, colorScheme, emoji } = body;

      if (!name || typeof name !== "string" || name.trim().length < 5) {
        return NextResponse.json(
          { error: "Group name must be at least 5 characters" },
          { status: 400 }
        );
      }

      const group = await createGroupService(
        auth.decodedToken,
        name.trim(),
        colorScheme || "orange",
        emoji || null
      );
      const transformedGroup = transformGroup(group);

      logger.info("Group created via API", { groupId: group.id });
      return NextResponse.json({ group: transformedGroup }, { status: 201 });
    }

    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  } catch (error) {
    logger.error("Groups API error", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withAuth(handler);
export const POST = withAuth(handler);
