import { signGuestToken } from "@/lib/auth/guest-token";
import { AppError } from "@/lib/errors";
import { handleApiError } from "@/lib/handle-api-error";
import { withRateLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { validateCodeSchema } from "../schemas";
import { validateGroupCodeService } from "../services";

/**
 * POST /api/groups/validate-code
 * Validates a group code and returns the groupId plus a signed, short-lived guest token.
 * The raw code is never returned or logged; guests present the token on later requests.
 * No authentication required
 */
async function handler(req: NextRequest) {
  try {
    const { code } = validateCodeSchema.parse(await req.json());
    const group = await validateGroupCodeService(code.toUpperCase());

    let guestToken: string;
    try {
      guestToken = signGuestToken(group.id);
    } catch {
      throw new AppError("Guest access is not configured", 500);
    }

    return NextResponse.json({
      groupId: group.id,
      groupName: group.name,
      guestToken,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withRateLimit("validate-code", handler);
