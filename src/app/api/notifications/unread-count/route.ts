import { withAuth, type AuthContext } from "@/src/lib/auth/with-auth";
import { handleApiError } from "@/src/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { getUnreadCountService } from "../services";

async function getHandler(_req: NextRequest, auth: AuthContext) {
  try {
    return NextResponse.json(await getUnreadCountService(auth.decodedToken));
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(getHandler);
