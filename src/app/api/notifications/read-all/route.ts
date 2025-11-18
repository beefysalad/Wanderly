import { AuthContext, withAuth } from "@/lib/auth/with-auth";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { markAllNotificationsReadService } from "../services";

async function handler(req: NextRequest, auth: AuthContext) {
  try {
    if (req.method !== "POST") {
      return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 }
      );
    }

    const result = await markAllNotificationsReadService(auth.decodedToken);

    return NextResponse.json(
      { count: result.count },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Mark all notifications read API error", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = withAuth(handler);

