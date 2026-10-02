import {
  withOptionalAuth,
  type OptionalAuthContext,
  type RouteContext,
} from "@/src/lib/auth/with-auth";
import { handleApiError } from "@/src/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { getGroupByIdForGuestService } from "../../services";
import { transformGroup } from "../../transformers";

type Params = RouteContext<{ groupId: string }>;

/**
 * GET /api/groups/[groupId]/guest
 * Returns group data for guest access (requires an X-Guest-Token header)
 */
async function handler(
  _req: NextRequest,
  context: OptionalAuthContext,
  { params }: Params,
) {
  try {
    const { groupId } = await params;
    const group = await getGroupByIdForGuestService(context.guestGroupId, groupId);

    return NextResponse.json(transformGroup(group));
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withOptionalAuth(handler);
