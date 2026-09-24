import { withAuth, type AuthContext } from "@/lib/auth/with-auth";
import { handleApiError } from "@/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { updateUserProfileSchema } from "./schemas";
import { updateUserProfileService } from "./services";

async function patchHandler(req: NextRequest, auth: AuthContext) {
  try {
    const body = updateUserProfileSchema.parse(await req.json());
    const user = await updateUserProfileService(
      { uid: auth.uid, email: auth.email, tokenName: auth.decodedToken.name },
      body,
    );
    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

export const PATCH = withAuth(patchHandler);
