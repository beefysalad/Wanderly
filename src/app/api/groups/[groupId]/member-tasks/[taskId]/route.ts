import { AuthContext, withAuth } from "@/lib/auth/with-auth";
import { logger } from "@/lib/logger";
import type { MemberTaskStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import {
  deleteMemberTaskService,
  updateMemberTaskService,
} from "../services";

async function handler(req: NextRequest, auth: AuthContext) {
  try {
    const pathParts = req.nextUrl.pathname.split("/");
    const taskId = pathParts[pathParts.length - 1];
    const groupId = pathParts[pathParts.length - 3];

    if (!groupId || !taskId) {
      return NextResponse.json(
        { error: "Group ID and task ID are required" },
        { status: 400 },
      );
    }

    if (req.method === "PATCH") {
      const { assignedToId, title, notes, dueDate, status } = await req.json();

      const task = await updateMemberTaskService(
        auth.decodedToken,
        groupId,
        taskId,
        {
          assignedToId,
          title,
          notes,
          dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
          status: status as MemberTaskStatus | undefined,
        },
      );

      return NextResponse.json({ task }, { status: 200 });
    }

    if (req.method === "DELETE") {
      await deleteMemberTaskService(auth.decodedToken, groupId, taskId);
      return NextResponse.json({ message: "Task deleted" }, { status: 200 });
    }

    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  } catch (error) {
    logger.error("Member task detail API error", error);
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

export const PATCH = withAuth(handler);
export const DELETE = withAuth(handler);
