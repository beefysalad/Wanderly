import { withAuth, type AuthContext, type RouteContext } from "@/lib/auth/with-auth";
import { handleApiError } from "@/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { exportTripIcsService } from "./services";

async function getHandler(
  _req: NextRequest,
  auth: AuthContext,
  { params }: RouteContext<{ tripId: string }>,
) {
  try {
    const { tripId } = await params;
    const { content, fileName } = await exportTripIcsService(auth.decodedToken, tripId);

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar;charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(getHandler);
