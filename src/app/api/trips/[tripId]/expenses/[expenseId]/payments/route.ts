import { withAuth, type AuthContext, type RouteContext } from "@/lib/auth/with-auth";
import { handleApiError } from "@/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { transformExpense } from "../../transformers";
import { markPaidSchema } from "./schemas";
import { markExpensePaidService } from "./services";

async function postHandler(
  req: NextRequest,
  auth: AuthContext,
  { params }: RouteContext<{ tripId: string; expenseId: string }>,
) {
  try {
    const { tripId, expenseId } = await params;
    const body = markPaidSchema.parse(await req.json());
    const expense = await markExpensePaidService(auth.decodedToken, tripId, expenseId, body);
    return NextResponse.json({ expense: transformExpense(expense) });
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withAuth(postHandler);
