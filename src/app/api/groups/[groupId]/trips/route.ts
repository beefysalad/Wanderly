import { withAuth, type AuthContext, type RouteContext } from "@/src/lib/auth/with-auth";
import { handleApiError } from "@/src/lib/handle-api-error";
import { logger } from "@/src/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { createTripSchema } from "./schemas";
import { createTripService } from "./services";
import { transformTrip } from "../../transformers";

type Params = RouteContext<{ groupId: string }>;

async function postHandler(req: NextRequest, auth: AuthContext, { params }: Params) {
  try {
    const { groupId } = await params;
    const body = createTripSchema.parse(await req.json());
    const trip = await createTripService(auth.decodedToken, groupId, body);
    logger.info("Trip created via API", { tripId: trip.id, groupId });
    return NextResponse.json({ trip: transformTrip(trip) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withAuth(postHandler);
