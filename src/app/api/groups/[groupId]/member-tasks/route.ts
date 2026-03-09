import { AuthContext, withAuth } from "@/lib/auth/with-auth";
import { logger } from "@/lib/logger";
import type { MemberTaskStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import {
  createMemberTaskService,
  listMemberTasksService,
} from "./services";

async function handler(req: NextRequest, auth: AuthContext) {
  try {
    const pathParts = req.nextUrl.pathname.split("/");
    const groupId = pathParts[pathParts.length - 2];

    if (!groupId) {
      return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
    }

    if (req.method === "GET") {
      const tasks = await listMemberTasksService(auth.decodedToken, groupId);
      return NextResponse.json({ tasks }, { status: 200 });
    }

    if (req.method === "POST") {
      const { assignedToId, title, notes, dueDate, status } = await req.json();

      if (!assignedToId || !title) {
        return NextResponse.json(
          { error: "assignedToId and title are required" },
          { status: 400 },
        );
      }

      const task = await createMemberTaskService(auth.decodedToken, groupId, {
        assignedToId,
        title,
        notes,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status as MemberTaskStatus | undefined,
      });

      return NextResponse.json({ task }, { status: 201 });
    }

    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  } catch (error) {
    logger.error("Member tasks API error", error);
    const message = error instanceof Error ? error.message : "Internal server error";

    if (
      message.includes("not a member") ||
      message.includes("not found") ||
      message.includes("Assignee")
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withAuth(handler);
export const POST = withAuth(handler);
