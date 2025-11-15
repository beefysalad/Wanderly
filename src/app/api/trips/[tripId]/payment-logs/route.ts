import { AuthContext, withAuth } from "@/lib/auth/with-auth";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import {
  listPaymentLogsService,
  createPaymentLogService,
} from "./services";
import { transformPaymentLog } from "../expenses/transformers";

async function handler(req: NextRequest, auth: AuthContext) {
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
      const paymentLogs = await listPaymentLogsService(
        auth.decodedToken,
        tripId
      );
      const transformedLogs = paymentLogs.map(transformPaymentLog);

      return NextResponse.json({ paymentLogs: transformedLogs });
    } else if (req.method === "POST") {
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
        auth.decodedToken,
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

export const GET = withAuth(handler);
export const POST = withAuth(handler);

