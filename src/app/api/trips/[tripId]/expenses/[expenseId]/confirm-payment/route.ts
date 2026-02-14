import { AuthContext, withAuth } from "@/lib/auth/with-auth";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { confirmPaymentService } from "../../services";
import { transformExpense } from "../../transformers";

async function handler(req: NextRequest, auth: AuthContext) {
  try {
    // Extract tripId and expenseId from URL path: /api/trips/[tripId]/expenses/[expenseId]/confirm-payment
    const pathParts = req.nextUrl.pathname.split("/");
    const expenseId = pathParts[pathParts.length - 2]; // expenseId is before /confirm-payment
    const tripId = pathParts[pathParts.length - 4]; // tripId is before /expenses

    if (!tripId || !expenseId) {
      return NextResponse.json(
        { error: "Trip ID and Expense ID are required" },
        { status: 400 },
      );
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { memberEmail, status } = body;

      if (!memberEmail || !status) {
        return NextResponse.json(
          { error: "memberEmail and status are required" },
          { status: 400 },
        );
      }

      if (status !== "confirmed" && status !== "rejected") {
        return NextResponse.json(
          { error: "Status must be 'confirmed' or 'rejected'" },
          { status: 400 },
        );
      }

      const expense = await confirmPaymentService(
        auth.decodedToken,
        tripId,
        expenseId,
        {
          memberEmail,
          status,
        },
      );

      const transformedExpense = transformExpense(expense);

      return NextResponse.json({ expense: transformedExpense });
    } else {
      return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 },
      );
    }
  } catch (error) {
    logger.error("Confirm Payment API error", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (
      message.includes("not found") ||
      message.includes("does not have access") ||
      message.includes("Only the payer")
    ) {
      return NextResponse.json({ error: message }, { status: 404 }); // checking 404/403 mapping
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = withAuth(handler);
