import { withAuth, type AuthContext } from "@/lib/auth/with-auth";
import { handleApiError } from "@/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { updateProfileSchema } from "./schemas";
import { getProfileService, updateProfileService } from "./services";

async function getHandler(_req: NextRequest, context: AuthContext) {
  try {
    const user = await getProfileService(context.decodedToken);
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

async function patchHandler(req: NextRequest, context: AuthContext) {
  try {
    const body = updateProfileSchema.parse(await req.json());
    const user = await updateProfileService(context.decodedToken, body);
    return NextResponse.json(
      { message: "Profile updated successfully", user },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(getHandler);
export const PATCH = withAuth(patchHandler);
