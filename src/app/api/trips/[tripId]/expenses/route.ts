import {
  withOptionalAuth,
  type OptionalAuthContext,
  type RouteContext,
} from "@/lib/auth/with-auth";
import { ForbiddenError } from "@/lib/errors";
import { handleApiError } from "@/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { createExpenseSchema } from "./schemas";
import {
  createExpenseService,
  listExpensesForGuestService,
  listExpensesService,
} from "./services";
import { transformExpense } from "./transformers";

type Params = RouteContext<{ tripId: string }>;

async function getHandler(_req: NextRequest, context: OptionalAuthContext, { params }: Params) {
  try {
    const { tripId } = await params;
    const expenses =
      context.isGuest && context.guestGroupId
        ? await listExpensesForGuestService(context.guestGroupId, tripId)
        : await listExpensesService(context.decodedToken, tripId);
    return NextResponse.json({ expenses: expenses.map(transformExpense) });
  } catch (error) {
    return handleApiError(error);
  }
}

async function postHandler(req: NextRequest, context: OptionalAuthContext, { params }: Params) {
  try {
    if (context.isGuest) {
      throw new ForbiddenError("Guest access not allowed for creating expenses");
    }
    const { tripId } = await params;
    const body = createExpenseSchema.parse(await req.json());
    const expense = await createExpenseService(context.decodedToken, tripId, body);
    return NextResponse.json({ expense: transformExpense(expense) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withOptionalAuth(getHandler);
export const POST = withOptionalAuth(postHandler);
