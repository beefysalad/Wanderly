import { withAuth, type AuthContext, type RouteContext } from "@/lib/auth/with-auth";
import { handleApiError } from "@/lib/handle-api-error";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { updateGroupSchema } from "../schemas";
import { deleteGroupService, getGroupByIdService, updateGroupService } from "../services";
import { transformGroup } from "../transformers";

type Params = RouteContext<{ groupId: string }>;

async function getHandler(_req: NextRequest, auth: AuthContext, { params }: Params) {
  try {
    const { groupId } = await params;
    const group = await getGroupByIdService(auth.decodedToken, groupId);
    return NextResponse.json({ group: transformGroup(group) });
  } catch (error) {
    return handleApiError(error);
  }
}

async function patchHandler(req: NextRequest, auth: AuthContext, { params }: Params) {
  try {
    const { groupId } = await params;
    const body = updateGroupSchema.parse(await req.json());
    const group = await updateGroupService(auth.decodedToken, groupId, body);
    logger.info("Group updated via API", { groupId });
    return NextResponse.json({ group: transformGroup(group) });
  } catch (error) {
    return handleApiError(error);
  }
}

async function deleteHandler(_req: NextRequest, auth: AuthContext, { params }: Params) {
  try {
    const { groupId } = await params;
    await deleteGroupService(auth.decodedToken, groupId);
    logger.info("Group deleted via API", { groupId });
    return NextResponse.json({ message: "Group deleted successfully" }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(getHandler);
export const PATCH = withAuth(patchHandler);
export const DELETE = withAuth(deleteHandler);
