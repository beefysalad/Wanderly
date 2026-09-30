import { withAuth, type AuthContext } from "@/src/lib/auth/with-auth";
import { handleApiError } from "@/src/lib/handle-api-error";
import { logger } from "@/src/lib/logger";
import { withRateLimit } from "@/src/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { joinGroupSchema } from "../schemas";
import { joinGroupService } from "../services";
import { transformGroup } from "../transformers";

async function handler(req: NextRequest, auth: AuthContext) {
  try {
    const { groupCode } = joinGroupSchema.parse(await req.json());
    const group = await joinGroupService(auth.decodedToken, groupCode.toUpperCase());
    logger.info("User joined group via API", { userId: auth.uid, groupId: group.id });
    return NextResponse.json({ group: transformGroup(group) }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withRateLimit("guest-join", withAuth(handler));
