import { withAuth, type AuthContext, type RouteContext } from "@/lib/auth/with-auth";
import { handleApiError } from "@/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { updateMemberTaskSchema } from "../schemas";
import { deleteMemberTaskService, updateMemberTaskService } from "../services";

type Params = RouteContext<{ groupId: string; taskId: string }>;

async function patchHandler(req: NextRequest, auth: AuthContext, { params }: Params) {
  try {
    const { groupId, taskId } = await params;
    const body = updateMemberTaskSchema.parse(await req.json());
    const task = await updateMemberTaskService(auth.decodedToken, groupId, taskId, body);
    return NextResponse.json({ task }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

async function deleteHandler(_req: NextRequest, auth: AuthContext, { params }: Params) {
  try {
    const { groupId, taskId } = await params;
    await deleteMemberTaskService(auth.decodedToken, groupId, taskId);
    return NextResponse.json({ message: "Task deleted" }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export const PATCH = withAuth(patchHandler);
export const DELETE = withAuth(deleteHandler);
