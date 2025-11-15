import { AuthContext, withAuth } from "@/lib/auth/with-auth";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { markExpensePaidService } from "./services";
import { transformExpense } from "../../transformers";

async function handler(req: NextRequest, auth: AuthContext) {
  try {
    // Extract tripId and expenseId from URL path: /api/trips/[tripId]/expenses/[expenseId]/payments
    const pathParts = req.nextUrl.pathname.split("/");
    const expenseId = pathParts[pathParts.length - 2]; // expenseId is before /payments
    const tripId = pathParts[pathParts.length - 4]; // tripId is before /expenses

    if (!tripId || !expenseId) {
      return NextResponse.json(
        { error: "Trip ID and Expense ID are required" },
        { status: 400 }
      );
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { memberEmail, isPaid, createPaymentLog } = body;

      if (!memberEmail || typeof isPaid !== "boolean") {
        return NextResponse.json(
          { error: "memberEmail and isPaid are required" },
          { status: 400 }
        );
      }

      const expense = await markExpensePaidService(
        auth.decodedToken,
        tripId,
        expenseId,
        {
          memberEmail,
          isPaid,
          createPaymentLog: createPaymentLog ?? true, // Default to creating payment log
        }
      );

      const transformedExpense = transformExpense(expense);

      return NextResponse.json({ expense: transformedExpense });
    } else {
      return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 }
      );
    }
  } catch (error) {
    logger.error("Payment API error", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (
      message.includes("not found") ||
      message.includes("does not have access") ||
      message.includes("not part of this expense")
    ) {
      return NextResponse.json(
        { error: message },
        { status: 404 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = withAuth(handler);

