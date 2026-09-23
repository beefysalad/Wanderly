import { withAuth, type AuthContext } from "@/lib/auth/with-auth";
import { handleApiError } from "@/lib/handle-api-error";
import { logger } from "@/lib/logger";
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

export const POST = withAuth(handler);
