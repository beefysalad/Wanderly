import { withAuth, type AuthContext, type RouteContext } from "@/lib/auth/with-auth";
import { handleApiError } from "@/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { updateTripSchema } from "../schemas";
import { deleteTripService, updateTripService } from "../services";
import { transformTrip } from "../../../transformers";

type Params = RouteContext<{ groupId: string; tripId: string }>;

async function patchHandler(req: NextRequest, auth: AuthContext, { params }: Params) {
  try {
    const { groupId, tripId } = await params;
    const body = updateTripSchema.parse(await req.json());
    const trip = await updateTripService(auth.decodedToken, groupId, tripId, body);
    return NextResponse.json({ trip: transformTrip(trip) });
  } catch (error) {
    return handleApiError(error);
  }
}

async function deleteHandler(_req: NextRequest, auth: AuthContext, { params }: Params) {
  try {
    const { groupId, tripId } = await params;
    await deleteTripService(auth.decodedToken, groupId, tripId);
    return NextResponse.json({ message: "Trip deleted successfully" }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export const PATCH = withAuth(patchHandler);
export const DELETE = withAuth(deleteHandler);
