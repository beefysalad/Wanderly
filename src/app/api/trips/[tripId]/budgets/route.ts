import {
  withOptionalAuth,
  type OptionalAuthContext,
  type RouteContext,
} from "@/lib/auth/with-auth";
import { ForbiddenError } from "@/lib/errors";
import { handleApiError } from "@/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { createBudgetSchema } from "./schemas";
import { createBudgetService, listBudgetsService } from "./services";

type Params = RouteContext<{ tripId: string }>;

async function getHandler(_req: NextRequest, context: OptionalAuthContext, { params }: Params) {
  try {
    if (context.isGuest) {
      throw new ForbiddenError("Guest access not yet implemented for budgets");
    }
    const { tripId } = await params;
    const budgets = await listBudgetsService(context.decodedToken, tripId);
    return NextResponse.json({ budgets });
  } catch (error) {
    return handleApiError(error);
  }
}

async function postHandler(req: NextRequest, context: OptionalAuthContext, { params }: Params) {
  try {
    if (context.isGuest) {
      throw new ForbiddenError("Guest access not allowed for creating budgets");
    }
    const { tripId } = await params;
    const body = createBudgetSchema.parse(await req.json());
    const budget = await createBudgetService(context.decodedToken, tripId, body);
    return NextResponse.json({ budget }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withOptionalAuth(getHandler);
export const POST = withOptionalAuth(postHandler);
