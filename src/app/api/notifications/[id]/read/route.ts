import { AuthContext, withAuth } from "@/lib/auth/with-auth";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { markNotificationReadService } from "../../services";

async function handler(req: NextRequest, auth: AuthContext) {
  try {
    if (req.method !== "POST") {
      return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 }
      );
    }

    // Extract notificationId from URL path: /api/notifications/[id]/read
    const pathParts = req.nextUrl.pathname.split("/");
    const notificationId = pathParts[pathParts.length - 2]; // notificationId is before /read

    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 }
      );
    }

    const notification = await markNotificationReadService(
      auth.decodedToken,
      notificationId
    );

    return NextResponse.json({ notification }, { status: 200 });
  } catch (error) {
    logger.error("Mark notification read API error", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (message.includes("not found") || message.includes("does not belong")) {
      return NextResponse.json(
        { error: "Notification not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = withAuth(handler);
