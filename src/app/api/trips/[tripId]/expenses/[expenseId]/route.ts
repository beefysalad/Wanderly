import { withAuth, type AuthContext, type RouteContext } from "@/lib/auth/with-auth";
import { handleApiError } from "@/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { updateExpenseSchema } from "../schemas";
import { deleteExpenseService, getExpenseByIdService, updateExpenseService } from "../services";
import { transformExpense } from "../transformers";

type Params = RouteContext<{ tripId: string; expenseId: string }>;

async function getHandler(_req: NextRequest, auth: AuthContext, { params }: Params) {
  try {
    const { tripId, expenseId } = await params;
    const expense = await getExpenseByIdService(auth.decodedToken, tripId, expenseId);
    return NextResponse.json({ expense: transformExpense(expense) });
  } catch (error) {
    return handleApiError(error);
  }
}

async function patchHandler(req: NextRequest, auth: AuthContext, { params }: Params) {
  try {
    const { tripId, expenseId } = await params;
    const body = updateExpenseSchema.parse(await req.json());
    const expense = await updateExpenseService(auth.decodedToken, tripId, expenseId, body);
    return NextResponse.json({ expense: transformExpense(expense) });
  } catch (error) {
    return handleApiError(error);
  }
}

async function deleteHandler(_req: NextRequest, auth: AuthContext, { params }: Params) {
  try {
    const { tripId, expenseId } = await params;
    await deleteExpenseService(auth.decodedToken, tripId, expenseId);
    return NextResponse.json({ message: "Expense deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(getHandler);
export const PATCH = withAuth(patchHandler);
export const DELETE = withAuth(deleteHandler);
