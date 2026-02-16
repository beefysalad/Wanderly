import {
  withOptionalAuth,
  type OptionalAuthContext,
} from "@/lib/auth/with-auth";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { updateBudgetService, deleteBudgetService } from "../services";

async function handler(req: NextRequest, context: OptionalAuthContext) {
  try {
    const pathParts = req.nextUrl.pathname.split("/");
    // URL: /api/trips/[tripId]/budgets/[budgetId]
    const tripId = pathParts[pathParts.length - 3];
    const budgetId = pathParts[pathParts.length - 1];

    if (!tripId || !budgetId) {
      return NextResponse.json(
        { error: "Trip ID and Budget ID are required" },
        { status: 400 },
      );
    }

    if (req.method === "PUT") {
      if (context.isGuest) {
        return NextResponse.json(
          { error: "Guest access not allowed for updating budgets" },
          { status: 403 },
        );
      }

      const body = await req.json();
      const budget = await updateBudgetService(
        context.decodedToken,
        tripId,
        budgetId,
        body,
      );

      return NextResponse.json({ budget });
    } else if (req.method === "DELETE") {
      if (context.isGuest) {
        return NextResponse.json(
          { error: "Guest access not allowed for deleting budgets" },
          { status: 403 },
        );
      }

      await deleteBudgetService(context.decodedToken, tripId, budgetId);
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 },
      );
    }
  } catch (error) {
    logger.error("Budget API error", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const PUT = withOptionalAuth(handler);
export const DELETE = withOptionalAuth(handler);
