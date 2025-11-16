import { AuthContext, withAuth } from "@/lib/auth/with-auth";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { updateActivityService, deleteActivityService } from "../services";
import { transformActivity } from "../../../../groups/transformers";

async function handler(req: NextRequest, auth: AuthContext) {
  try {
    // Extract tripId and activityId from URL path: /api/trips/[tripId]/activities/[activityId]
    const pathParts = req.nextUrl.pathname.split("/");
    const activityId = pathParts[pathParts.length - 1];
    const tripId = pathParts[pathParts.length - 3]; // tripId is before /activities

    if (!tripId || !activityId) {
      return NextResponse.json(
        { error: "Trip ID and Activity ID are required" },
        { status: 400 }
      );
    }

    if (req.method === "PATCH") {
      const body = await req.json();
      const {
        title,
        date,
        startTime,
        endTime,
        notes,
        done,
        transportationMode,
        pickupTime,
        pickupLocation,
        dropoffLocation,
      } = body;

      const activity = await updateActivityService(
        auth.decodedToken,
        tripId,
        activityId,
        {
          ...(title !== undefined && { title }),
          ...(date !== undefined && { date: new Date(date) }),
          ...(startTime !== undefined && { startTime }),
          ...(endTime !== undefined && { endTime }),
          ...(notes !== undefined && { notes }),
          ...(done !== undefined && { done }),
          ...(transportationMode !== undefined && { transportationMode }),
          ...(pickupTime !== undefined && { pickupTime }),
          ...(pickupLocation !== undefined && { pickupLocation }),
          ...(dropoffLocation !== undefined && { dropoffLocation }),
        }
      );

      const transformedActivity = transformActivity(activity);

      return NextResponse.json({ activity: transformedActivity });
    } else if (req.method === "DELETE") {
      await deleteActivityService(auth.decodedToken, tripId, activityId);

      return NextResponse.json(
        { message: "Activity deleted successfully" },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 }
      );
    }
  } catch (error) {
    logger.error("Activity API error", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (
      message.includes("not found") ||
      message.includes("does not have access") ||
      message.includes("does not belong")
    ) {
      return NextResponse.json(
        { error: "Activity not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const PATCH = withAuth(handler);
export const DELETE = withAuth(handler);
