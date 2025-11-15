import { AuthContext, withAuth } from "@/lib/auth/with-auth";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { createTripService } from "./services";
import { transformTrip } from "../../transformers";
import { TripStatus } from "@prisma/client";

async function handler(req: NextRequest, auth: AuthContext) {
  try {
    if (req.method !== "POST") {
      return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 }
      );
    }

    // Extract groupId from URL path: /api/groups/[groupId]/trips
    const pathParts = req.nextUrl.pathname.split("/");
    const groupIdIndex = pathParts.indexOf("groups");
    const groupId = pathParts[groupIdIndex + 1];

    if (!groupId) {
      return NextResponse.json(
        { error: "Group ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { tripName, startDate, endDate, location, status } = body;

    // Validate required fields
    if (
      !tripName ||
      typeof tripName !== "string" ||
      tripName.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Trip name is required" },
        { status: 400 }
      );
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start date and end date are required" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    if (start > end) {
      return NextResponse.json(
        { error: "Start date must be before end date" },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses: TripStatus[] = [
      "planning",
      "finalized",
      "ongoing",
      "cancelled",
    ];
    const tripStatus: TripStatus = validStatuses.includes(status)
      ? status
      : "planning";

    const trip = await createTripService(auth.decodedToken, groupId, {
      name: tripName.trim(),
      startDate: start,
      endDate: end,
      location: location?.trim() || undefined,
      status: tripStatus,
    });

    const transformedTrip = transformTrip(trip);

    logger.info("Trip created via API", { tripId: trip.id, groupId });
    return NextResponse.json({ trip: transformedTrip }, { status: 201 });
  } catch (error) {
    logger.error("Create trip API error", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (message.includes("not a member") || message.includes("not found")) {
      return NextResponse.json(
        { error: "Group not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = withAuth(handler);
