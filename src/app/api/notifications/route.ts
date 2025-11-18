import { AuthContext, withAuth } from "@/lib/auth/with-auth";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import {
  listNotificationsService,
  createNotificationService,
} from "./services";
import { NotificationType } from "@prisma/client";

async function handler(req: NextRequest, auth: AuthContext) {
  try {
    if (req.method === "GET") {
      const { searchParams } = new URL(req.url);
      const limit = searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : undefined;
      const offset = searchParams.get("offset")
        ? parseInt(searchParams.get("offset")!)
        : undefined;
      const read = searchParams.get("read")
        ? searchParams.get("read") === "true"
        : undefined;

      const result = await listNotificationsService(auth.decodedToken, {
        limit,
        offset,
        read,
      });

      return NextResponse.json(result);
    } else if (req.method === "POST") {
      // Internal use for creating notifications
      const body = await req.json();
      const {
        userId,
        type,
        title,
        message,
        relatedGroupId,
        relatedTripId,
        relatedExpenseId,
        relatedActivityId,
      } = body;

      if (!userId || !type || !title || !message) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }

      const notification = await createNotificationService(userId, {
        type: type as NotificationType,
        title,
        message,
        relatedGroupId,
        relatedTripId,
        relatedExpenseId,
        relatedActivityId,
      });

      return NextResponse.json({ notification }, { status: 201 });
    } else {
      return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 }
      );
    }
  } catch (error) {
    logger.error("Notification API error", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withAuth(handler);
export const POST = withAuth(handler);

