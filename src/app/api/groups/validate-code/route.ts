import { handleApiError } from "@/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { validateCodeSchema } from "../schemas";
import { validateGroupCodeService } from "../services";

/**
 * POST /api/groups/validate-code
 * Validates a group code and returns the groupId
 * No authentication required
 */
export async function POST(req: NextRequest) {
  try {
    const { code } = validateCodeSchema.parse(await req.json());
    const group = await validateGroupCodeService(code.toUpperCase());

    return NextResponse.json({
      groupId: group.id,
      groupName: group.name,
      code: group.code,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
