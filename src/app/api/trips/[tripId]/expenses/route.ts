import { AuthContext, withAuth } from "@/lib/auth/with-auth";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import {
  listExpensesService,
  createExpenseService,
} from "./services";
import { transformExpense } from "./transformers";
import { PaymentMethod } from "@prisma/client";

async function handler(req: NextRequest, auth: AuthContext) {
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
      const expenses = await listExpensesService(auth.decodedToken, tripId);
      const transformedExpenses = expenses.map(transformExpense);

      return NextResponse.json({ expenses: transformedExpenses });
    } else if (req.method === "POST") {
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
      } = body;

      if (!paidBy || !amount || !description || !date || !splitWith) {
        return NextResponse.json(
          { error: "Missing required expense fields" },
          { status: 400 }
        );
      }

      const expense = await createExpenseService(auth.decodedToken, tripId, {
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

export const GET = withAuth(handler);
export const POST = withAuth(handler);

