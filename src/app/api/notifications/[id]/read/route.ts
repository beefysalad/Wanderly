import { withAuth, type AuthContext, type RouteContext } from "@/lib/auth/with-auth";
import { handleApiError } from "@/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { markNotificationReadService } from "../../services";

async function postHandler(
  _req: NextRequest,
  auth: AuthContext,
  { params }: RouteContext<{ id: string }>,
) {
  try {
    const { id } = await params;
    const notification = await markNotificationReadService(auth.decodedToken, id);
    return NextResponse.json({ notification });
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withAuth(postHandler);
