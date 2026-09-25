import { withAuth, type AuthContext, type RouteContext } from "@/lib/auth/with-auth";
import { handleApiError } from "@/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { transformActivity } from "../../../groups/transformers";
import { createActivitySchema } from "./schemas";
import { createActivityService } from "./services";

async function postHandler(
  req: NextRequest,
  auth: AuthContext,
  { params }: RouteContext<{ tripId: string }>,
) {
  try {
    const { tripId } = await params;
    const body = createActivitySchema.parse(await req.json());
    const activity = await createActivityService(auth.decodedToken, tripId, body);
    return NextResponse.json({ activity: transformActivity(activity) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withAuth(postHandler);
