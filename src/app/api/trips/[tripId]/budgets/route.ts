import {
  withOptionalAuth,
  type OptionalAuthContext,
} from "@/lib/auth/with-auth";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { listBudgetsService, createBudgetService } from "./services";

async function handler(req: NextRequest, context: OptionalAuthContext) {
  try {
    const pathParts = req.nextUrl.pathname.split("/");
    // URL: /api/trips/[tripId]/budgets
    const tripId = pathParts[pathParts.length - 2];

    if (!tripId) {
      return NextResponse.json(
        { error: "Trip ID is required" },
        { status: 400 },
      );
    }

    if (req.method === "GET") {
      if (context.isGuest) {
        return NextResponse.json(
          { error: "Guest access not yet implemented for budgets" },
          { status: 403 },
        );
      }

      const budgets = await listBudgetsService(context.decodedToken, tripId);
      return NextResponse.json({ budgets });
    } else if (req.method === "POST") {
      if (context.isGuest) {
        return NextResponse.json(
          { error: "Guest access not allowed for creating budgets" },
          { status: 403 },
        );
      }

      const body = await req.json();
      const { amount, description, category, activityId, isBooked } = body;

      if (amount === undefined) {
        return NextResponse.json(
          { error: "Amount is required" },
          { status: 400 },
        );
      }

      const budget = await createBudgetService(context.decodedToken, tripId, {
        amount: Number(amount),
        description,
        category,
        activityId,
        isBooked,
      });

      return NextResponse.json({ budget }, { status: 201 });
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

export const GET = withOptionalAuth(handler);
export const POST = withOptionalAuth(handler);
