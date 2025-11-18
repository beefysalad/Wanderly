import { AuthContext, withAuth } from "@/lib/auth/with-auth";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { confirmPaymentService } from "../services";
import { transformExpense } from "../../../transformers";

async function handler(req: NextRequest, auth: AuthContext) {
  try {
    // Extract tripId and expenseId from URL path: /api/trips/[tripId]/expenses/[expenseId]/payments/confirm
    const pathParts = req.nextUrl.pathname.split("/");
    // Path structure: ["", "api", "trips", tripId, "expenses", expenseId, "payments", "confirm"]
    const expenseId = pathParts[pathParts.length - 3]; // expenseId is before /payments/confirm
    const tripId = pathParts[pathParts.length - 5]; // tripId is before /expenses

    if (!tripId || !expenseId) {
      return NextResponse.json(
        { error: "Trip ID and Expense ID are required" },
        { status: 400 }
      );
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { memberEmail, status } = body;

      if (!memberEmail || !status) {
        return NextResponse.json(
          { error: "memberEmail and status are required" },
          { status: 400 }
        );
      }

      if (status !== "confirmed" && status !== "rejected") {
        return NextResponse.json(
          { error: "status must be 'confirmed' or 'rejected'" },
          { status: 400 }
        );
      }

      const expense = await confirmPaymentService(
        auth.decodedToken,
        tripId,
        expenseId,
        {
          memberEmail,
          status,
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
    logger.error("Payment confirmation API error", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (
      message.includes("not found") ||
      message.includes("does not have access") ||
      message.includes("Only the payer")
    ) {
      return NextResponse.json(
        { error: message },
        { status: 403 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = withAuth(handler);

