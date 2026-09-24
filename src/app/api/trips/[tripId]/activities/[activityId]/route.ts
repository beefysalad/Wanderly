import { withAuth, type AuthContext, type RouteContext } from "@/lib/auth/with-auth";
import { handleApiError } from "@/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { transformActivity } from "../../../../groups/transformers";
import { updateActivitySchema } from "../schemas";
import { deleteActivityService, updateActivityService } from "../services";

type Params = RouteContext<{ tripId: string; activityId: string }>;

async function patchHandler(req: NextRequest, auth: AuthContext, { params }: Params) {
  try {
    const { tripId, activityId } = await params;
    const body = updateActivitySchema.parse(await req.json());
    const activity = await updateActivityService(auth.decodedToken, tripId, activityId, body);
    return NextResponse.json({ activity: transformActivity(activity) });
  } catch (error) {
    return handleApiError(error);
  }
}

async function deleteHandler(_req: NextRequest, auth: AuthContext, { params }: Params) {
  try {
    const { tripId, activityId } = await params;
    await deleteActivityService(auth.decodedToken, tripId, activityId);
    return NextResponse.json({ message: "Activity deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}

export const PATCH = withAuth(patchHandler);
export const DELETE = withAuth(deleteHandler);
