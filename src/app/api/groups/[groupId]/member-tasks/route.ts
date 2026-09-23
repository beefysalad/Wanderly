import { withAuth, type AuthContext, type RouteContext } from "@/lib/auth/with-auth";
import { handleApiError } from "@/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { createMemberTaskSchema } from "./schemas";
import { createMemberTaskService, listMemberTasksService } from "./services";

type Params = RouteContext<{ groupId: string }>;

async function getHandler(_req: NextRequest, auth: AuthContext, { params }: Params) {
  try {
    const { groupId } = await params;
    const tasks = await listMemberTasksService(auth.decodedToken, groupId);
    return NextResponse.json({ tasks }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

async function postHandler(req: NextRequest, auth: AuthContext, { params }: Params) {
  try {
    const { groupId } = await params;
    const body = createMemberTaskSchema.parse(await req.json());
    const task = await createMemberTaskService(auth.decodedToken, groupId, body);
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
