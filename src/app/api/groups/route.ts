import { withAuth, type AuthContext } from "@/src/lib/auth/with-auth";
import { handleApiError } from "@/src/lib/handle-api-error";
import { logger } from "@/src/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { createGroupSchema } from "./schemas";
import { createGroupService, listGroupsService } from "./services";
import { transformGroup, transformGroupListItem } from "./transformers";

async function getHandler(_req: NextRequest, auth: AuthContext) {
  try {
    const groups = await listGroupsService(auth.decodedToken);
    return NextResponse.json({ groups: groups.map(transformGroupListItem) });
  } catch (error) {
    return handleApiError(error);
  }
}

async function postHandler(req: NextRequest, auth: AuthContext) {
  try {
    const body = createGroupSchema.parse(await req.json());
    const group = await createGroupService(auth.decodedToken, body);
    logger.info("Group created via API", { groupId: group.id });
    return NextResponse.json({ group: transformGroup(group) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
