import {
  withOptionalAuth,
  type OptionalAuthContext,
  type RouteContext,
} from "@/lib/auth/with-auth";
import { ForbiddenError } from "@/lib/errors";
import { handleApiError } from "@/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { transformPaymentLog } from "../expenses/transformers";
import { createPaymentLogSchema } from "./schemas";
import {
  createPaymentLogService,
  listPaymentLogsForGuestService,
  listPaymentLogsService,
} from "./services";

type Params = RouteContext<{ tripId: string }>;

async function getHandler(_req: NextRequest, context: OptionalAuthContext, { params }: Params) {
  try {
    const { tripId } = await params;
    const paymentLogs =
      context.isGuest && context.groupCode
        ? await listPaymentLogsForGuestService(context.groupCode, tripId)
        : await listPaymentLogsService(context.decodedToken, tripId);
    return NextResponse.json({ paymentLogs: paymentLogs.map(transformPaymentLog) });
  } catch (error) {
    return handleApiError(error);
  }
}

async function postHandler(req: NextRequest, context: OptionalAuthContext, { params }: Params) {
  try {
    if (context.isGuest) {
      throw new ForbiddenError("Guest access not allowed for creating payment logs");
    }
    const { tripId } = await params;
    const body = createPaymentLogSchema.parse(await req.json());
    const paymentLog = await createPaymentLogService(context.decodedToken, tripId, body);
    return NextResponse.json({ paymentLog: transformPaymentLog(paymentLog) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withOptionalAuth(getHandler);
export const POST = withOptionalAuth(postHandler);
