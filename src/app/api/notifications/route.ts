import { withAuth, type AuthContext } from "@/lib/auth/with-auth";
import { handleApiError } from "@/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { listNotificationsQuerySchema } from "./schemas";
import { listNotificationsService } from "./services";

async function getHandler(req: NextRequest, auth: AuthContext) {
  try {
    const query = listNotificationsQuerySchema.parse(
      Object.fromEntries(new URL(req.url).searchParams),
    );
    return NextResponse.json(await listNotificationsService(auth.decodedToken, query));
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(getHandler);
