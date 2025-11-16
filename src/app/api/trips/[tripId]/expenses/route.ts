import {
  withOptionalAuth,
  type OptionalAuthContext,
} from "@/lib/auth/with-auth";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import {
  listExpensesService,
  listExpensesForGuestService,
  createExpenseService,
} from "./services";
import { transformExpense } from "./transformers";
import { PaymentMethod } from "@prisma/client";

async function handler(req: NextRequest, context: OptionalAuthContext) {
  try {
    // Extract tripId from URL path: /api/trips/[tripId]/expenses
    const pathParts = req.nextUrl.pathname.split("/");
    const tripId = pathParts[pathParts.length - 2]; // tripId is before /expenses

    if (!tripId) {
      return NextResponse.json(
        { error: "Trip ID is required" },
        { status: 400 }
      );
    }

    if (req.method === "GET") {
      let expenses;
      if (context.isGuest && context.groupCode) {
        expenses = await listExpensesForGuestService(context.groupCode, tripId);
      } else {
        expenses = await listExpensesService(context.decodedToken, tripId);
      }
      const transformedExpenses = expenses.map(transformExpense);

      return NextResponse.json({ expenses: transformedExpenses });
    } else if (req.method === "POST") {
      // POST requires authentication
      if (context.isGuest) {
        return NextResponse.json(
          { error: "Guest access not allowed for creating expenses" },
          { status: 403 }
        );
      }
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

      if (!paidBy || !amount || !description || !date || !splitWith) {
        return NextResponse.json(
          { error: "Missing required expense fields" },
          { status: 400 }
        );
      }

      const expense = await createExpenseService(context.decodedToken, tripId, {
        paidBy,
        amount: Number(amount),
        description,
        date: new Date(date),
        category,
        paymentMethod:
          paymentMethod && paymentMethod !== "cash"
            ? (paymentMethod as "bank" | "maya" | "gcash")
            : undefined,
        accountNumber,
        bankName,
        accountName,
        qrImage,
        splitWith: Array.isArray(splitWith) ? splitWith : [],
        activityId,
      });

      const transformedExpense = transformExpense(expense);

      return NextResponse.json({ expense: transformedExpense }, { status: 201 });
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
      message.includes("not found")
    ) {
      return NextResponse.json(
        { error: "Trip not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withOptionalAuth(handler);
export const POST = withOptionalAuth(handler);

