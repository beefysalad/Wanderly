import { AuthContext, withAuth } from "@/lib/auth/with-auth";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { createActivityService } from "./services";
import { transformActivity } from "../../../groups/transformers";

async function handler(req: NextRequest, auth: AuthContext) {
  try {
    if (req.method !== "POST") {
      return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 }
      );
    }

    // Extract tripId from URL path: /api/trips/[tripId]/activities
    const pathParts = req.nextUrl.pathname.split("/");
    const tripId = pathParts[pathParts.length - 2]; // tripId is before /activities

    if (!tripId) {
      return NextResponse.json(
        { error: "Trip ID is required" },
        { status: 400 }
      );
    }

    const { title, date, startTime, endTime, notes } = await req.json();

    if (!title || !date) {
      return NextResponse.json(
        { error: "Title and date are required" },
        { status: 400 }
      );
    }

    const activity = await createActivityService(auth.decodedToken, tripId, {
      title,
      date: new Date(date),
      startTime,
      endTime,
      notes,
    });

    const transformedActivity = transformActivity(activity);

    return NextResponse.json(
      { activity: transformedActivity },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Create activity API error", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (
      message.includes("not found") ||
      message.includes("does not have access")
    ) {
      return NextResponse.json(
        { error: "Trip not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = withAuth(handler);
