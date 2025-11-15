import {
  withOptionalAuth,
  type OptionalAuthContext,
} from "@/lib/auth/with-auth";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import {
  listPaymentLogsService,
  listPaymentLogsForGuestService,
  createPaymentLogService,
} from "./services";
import { transformPaymentLog } from "../expenses/transformers";

async function handler(req: NextRequest, context: OptionalAuthContext) {
  try {
    // Extract tripId from URL path: /api/trips/[tripId]/payment-logs
    const pathParts = req.nextUrl.pathname.split("/");
    const tripId = pathParts[pathParts.length - 2]; // tripId is before /payment-logs

    if (!tripId) {
      return NextResponse.json(
        { error: "Trip ID is required" },
        { status: 400 }
      );
    }

    if (req.method === "GET") {
      let paymentLogs;
      if (context.isGuest && context.groupCode) {
        paymentLogs = await listPaymentLogsForGuestService(
          context.groupCode,
          tripId
        );
      } else {
        paymentLogs = await listPaymentLogsService(
          context.decodedToken,
          tripId
        );
      }
      const transformedLogs = paymentLogs.map(transformPaymentLog);

      return NextResponse.json({ paymentLogs: transformedLogs });
    } else if (req.method === "POST") {
      // POST requires authentication
      if (context.isGuest) {
        return NextResponse.json(
          { error: "Guest access not allowed for creating payment logs" },
          { status: 403 }
        );
      }
      const body = await req.json();
      const { expenseId, payerEmail, payeeEmail, amount, paymentMethod } =
        body;

      if (!expenseId || !payerEmail || !payeeEmail || !amount) {
        return NextResponse.json(
          { error: "Missing required payment log fields" },
          { status: 400 }
        );
      }

      const paymentLog = await createPaymentLogService(
        context.decodedToken,
        tripId,
        {
          expenseId,
          payerEmail,
          payeeEmail,
          amount: Number(amount),
          paymentMethod:
            paymentMethod && paymentMethod !== "cash"
              ? (paymentMethod as "bank" | "maya" | "gcash")
              : undefined,
        }
      );

      const transformedLog = transformPaymentLog(paymentLog);

      return NextResponse.json(
        { paymentLog: transformedLog },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 }
      );
    }
  } catch (error) {
    logger.error("Payment log API error", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (
      message.includes("not found") ||
      message.includes("does not have access") ||
      message.includes("does not belong")
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

