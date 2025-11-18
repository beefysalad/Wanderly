import { AuthContext, withAuth } from "@/lib/auth/with-auth";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getUnreadCountService } from "../services";

async function handler(req: NextRequest, auth: AuthContext) {
  try {
    if (req.method !== "GET") {
      return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 }
      );
    }

    const result = await getUnreadCountService(auth.decodedToken);

    return NextResponse.json(result);
  } catch (error) {
    logger.error("Get unread count API error", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withAuth(handler);

