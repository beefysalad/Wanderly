import {
  withOptionalAuth,
  type OptionalAuthContext,
  type RouteContext,
} from "@/lib/auth/with-auth";
import { ForbiddenError } from "@/lib/errors";
import { handleApiError } from "@/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { updateBudgetSchema } from "../schemas";
import { deleteBudgetService, updateBudgetService } from "../services";

type Params = RouteContext<{ tripId: string; budgetId: string }>;

async function putHandler(req: NextRequest, context: OptionalAuthContext, { params }: Params) {
  try {
    if (context.isGuest) {
      throw new ForbiddenError("Guest access not allowed for updating budgets");
    }
    const { tripId, budgetId } = await params;
    const body = updateBudgetSchema.parse(await req.json());
    const budget = await updateBudgetService(context.decodedToken, tripId, budgetId, body);
    return NextResponse.json({ budget });
  } catch (error) {
    return handleApiError(error);
  }
}

async function deleteHandler(_req: NextRequest, context: OptionalAuthContext, { params }: Params) {
  try {
    if (context.isGuest) {
      throw new ForbiddenError("Guest access not allowed for deleting budgets");
    }
    const { tripId, budgetId } = await params;
    await deleteBudgetService(context.decodedToken, tripId, budgetId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export const PUT = withOptionalAuth(putHandler);
export const DELETE = withOptionalAuth(deleteHandler);
