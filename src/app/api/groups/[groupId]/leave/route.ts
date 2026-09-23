import { withAuth, type AuthContext, type RouteContext } from "@/lib/auth/with-auth";
import { handleApiError } from "@/lib/handle-api-error";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { leaveGroupService } from "../../services";

type Params = RouteContext<{ groupId: string }>;

async function handler(_req: NextRequest, auth: AuthContext, { params }: Params) {
  try {
    const { groupId } = await params;
    await leaveGroupService(auth.decodedToken, groupId);
    logger.info("User left group via API", { groupId });
    return NextResponse.json({ message: "Successfully left group" }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withAuth(handler);
