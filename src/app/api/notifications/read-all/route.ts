import { withAuth, type AuthContext } from "@/lib/auth/with-auth";
import { handleApiError } from "@/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { markAllNotificationsReadService } from "../services";

async function postHandler(_req: NextRequest, auth: AuthContext) {
  try {
    const result = await markAllNotificationsReadService(auth.decodedToken);
    return NextResponse.json({ count: result.count });
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withAuth(postHandler);
