import {
  withOptionalAuth,
  type OptionalAuthContext,
  type RouteContext,
} from "@/lib/auth/with-auth";
import { handleApiError } from "@/lib/handle-api-error";
import { ForbiddenError } from "@/lib/errors";
import { NextRequest, NextResponse } from "next/server";
import { getGroupByIdForGuestService } from "../../services";
import { transformGroup } from "../../transformers";

type Params = RouteContext<{ groupId: string }>;

/**
 * GET /api/groups/[groupId]/guest
 * Returns group data for guest access (requires X-Guest-Code header)
 */
async function handler(
  _req: NextRequest,
  context: OptionalAuthContext,
  { params }: Params,
) {
  try {
    if (!context.isGuest || !context.guestGroupId) {
      throw new ForbiddenError("Guest access required");
    }

    const { groupId } = await params;
    const group = await getGroupByIdForGuestService(context.guestGroupId, groupId);

    return NextResponse.json(transformGroup(group));
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withOptionalAuth(handler);
