import { withAuth, type AuthContext } from "@/lib/auth/with-auth";
import { handleApiError } from "@/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { syncUserToDatabaseService } from "./syncService";

async function handler(_req: NextRequest, auth: AuthContext) {
  try {
    const user = await syncUserToDatabaseService(auth.decodedToken);
    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withAuth(handler);
export const GET = withAuth(handler);
