import { withAuth, type AuthContext } from "@/lib/auth/with-auth";
import { handleApiError } from "@/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { updatePasswordSchema } from "../schemas";
import { updatePasswordService } from "../services";

async function patchHandler(req: NextRequest, context: AuthContext) {
  try {
    const body = updatePasswordSchema.parse(await req.json());
    await updatePasswordService(context.decodedToken, body);
    return NextResponse.json(
      { message: "Password updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export const PATCH = withAuth(patchHandler);
