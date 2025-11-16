import { AuthContext, withAuth } from "@/lib/auth/with-auth";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import {
  getExpenseByIdService,
  updateExpenseService,
  deleteExpenseService,
} from "../services";
import { transformExpense } from "../transformers";

async function handler(req: NextRequest, auth: AuthContext) {
  try {
    // Extract tripId and expenseId from URL path: /api/trips/[tripId]/expenses/[expenseId]
    const pathParts = req.nextUrl.pathname.split("/");
    const expenseId = pathParts[pathParts.length - 1];
    const tripId = pathParts[pathParts.length - 3]; // tripId is before /expenses

    if (!tripId || !expenseId) {
      return NextResponse.json(
        { error: "Trip ID and Expense ID are required" },
        { status: 400 }
      );
    }

    if (req.method === "GET") {
      const expense = await getExpenseByIdService(
        auth.decodedToken,
        tripId,
        expenseId
      );
      const transformedExpense = transformExpense(expense);

      return NextResponse.json({ expense: transformedExpense });
    } else if (req.method === "PATCH") {
      const body = await req.json();
      const {
        paidBy,
        amount,
        description,
        date,
        category,
        paymentMethod,
        accountNumber,
        bankName,
        accountName,
        qrImage,
        splitWith,
        activityId,
      } = body;

      const expense = await updateExpenseService(
        auth.decodedToken,
        tripId,
        expenseId,
        {
          ...(paidBy !== undefined && { paidBy }),
          ...(amount !== undefined && { amount: Number(amount) }),
          ...(description !== undefined && { description }),
          ...(date !== undefined && { date: new Date(date) }),
          ...(category !== undefined && { category }),
          ...(paymentMethod !== undefined && {
            paymentMethod:
              paymentMethod && paymentMethod !== "cash"
                ? (paymentMethod as "bank" | "maya" | "gcash")
                : undefined,
          }),
          ...(accountNumber !== undefined && { accountNumber }),
          ...(bankName !== undefined && { bankName }),
          ...(accountName !== undefined && { accountName }),
          ...(qrImage !== undefined && { qrImage }),
          ...(splitWith !== undefined && { splitWith }),
          ...(activityId !== undefined && { activityId }),
        }
      );

      const transformedExpense = transformExpense(expense);

      return NextResponse.json({ expense: transformedExpense });
    } else if (req.method === "DELETE") {
      await deleteExpenseService(auth.decodedToken, tripId, expenseId);

      return NextResponse.json(
        { message: "Expense deleted successfully" },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 }
      );
    }
  } catch (error) {
    logger.error("Expense API error", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (
      message.includes("not found") ||
      message.includes("does not have access") ||
      message.includes("does not belong")
    ) {
      return NextResponse.json(
        { error: "Expense not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withAuth(handler);
export const PATCH = withAuth(handler);
export const DELETE = withAuth(handler);
