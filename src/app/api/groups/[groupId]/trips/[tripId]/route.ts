import { AuthContext, withAuth } from "@/lib/auth/with-auth";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { deleteTripService, updateTripService } from "./services";
import { transformTrip } from "../../../transformers";
import { TripStatus } from "@prisma/client";

async function handler(req: NextRequest, auth: AuthContext) {
  try {
    // Extract groupId and tripId from URL path: /api/groups/[groupId]/trips/[tripId]
    const pathParts = req.nextUrl.pathname.split("/");
    const groupIdIndex = pathParts.indexOf("groups");
    const tripIdIndex = pathParts.indexOf("trips");
    const groupId = pathParts[groupIdIndex + 1];
    const tripId = pathParts[tripIdIndex + 1];

    if (!groupId || !tripId) {
      return NextResponse.json(
        { error: "Group ID and Trip ID are required" },
        { status: 400 }
      );
    }

    if (req.method === "PATCH") {
      const body = await req.json();
      const { name, startDate, endDate, location, status } = body;

      // Validate status if provided
      if (status !== undefined) {
        const validStatuses: TripStatus[] = [
          "planning",
          "finalized",
          "ongoing",
          "cancelled",
        ];
        if (!validStatuses.includes(status)) {
          return NextResponse.json(
            { error: "Invalid status" },
            { status: 400 }
          );
        }
      }

      const trip = await updateTripService(auth.decodedToken, groupId, tripId, {
        ...(name !== undefined && { name }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: new Date(endDate) }),
        ...(location !== undefined && { location }),
        ...(status !== undefined && { status: status as TripStatus }),
      });

      const transformedTrip = transformTrip(trip);

      return NextResponse.json({ trip: transformedTrip });
    } else if (req.method === "DELETE") {
      await deleteTripService(auth.decodedToken, groupId, tripId);

      return NextResponse.json(
        { message: "Trip deleted successfully" },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 }
      );
    }
  } catch (error) {
    logger.error("Trip API error", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (
      message.includes("not found") ||
      message.includes("not a member") ||
      message.includes("does not belong")
    ) {
      return NextResponse.json(
        { error: "Trip not found or access denied" },
        { status: 404 }
      );
    }

    if (message.includes("Only the trip creator")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const PATCH = withAuth(handler);
export const DELETE = withAuth(handler);
