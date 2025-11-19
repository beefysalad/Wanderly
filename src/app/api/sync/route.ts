import { AuthContext, withAuth } from "@/lib/auth/with-auth";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { syncUserToDatabaseService } from "./syncService";

async function handler(req: Request, auth: AuthContext) {
  try {
    logger.info("Calling User Sync to Databae Service");
    const user = await syncUserToDatabaseService(auth.decodedToken);
    logger.info("✅ User sync completed successfully");
    return NextResponse.json({ user });
  } catch (error) {
    console.error("User Sync Error", error);
    return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
  }
}
export const POST = withAuth(handler);
export const GET = withAuth(handler);
