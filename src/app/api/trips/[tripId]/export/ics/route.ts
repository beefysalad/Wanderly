import { NextRequest, NextResponse } from "next/server";
import { AuthContext, withAuth } from "@/lib/auth/with-auth";
import prisma from "@/lib/prisma";
import { syncUserToDatabaseService } from "../../../../sync/syncService";
import type { DecodedIdToken } from "firebase-admin/auth";

/**
 * Gets or creates a user in the database from Firebase token
 */
async function getOrCreateUser(token: DecodedIdToken) {
  return await syncUserToDatabaseService(token);
}

/**
 * Verifies user has access to a trip (is member of the group)
 */
async function verifyTripAccess(
  token: DecodedIdToken,
  tripId: string
): Promise<{ trip: { groupId: string }; user: { id: string } }> {
  const user = await getOrCreateUser(token);

  // Get trip with group
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true, groupId: true },
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  // Verify user is a member of the group
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId: trip.groupId,
        userId: user.id,
      },
    },
  });

  if (!membership) {
    throw new Error("User does not have access to this trip");
  }

  return { trip, user };
}

/**
 * Escape text for ICS format (escape commas, semicolons, newlines, backslashes)
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");
}

/**
 * Generate a unique UID for ICS events
 */
function generateEventUID(activityId: string, tripId: string): string {
  return `${activityId}-${tripId}@wanderly.app`;
}

/**
 * Format date and time for ICS format using floating time (YYYYMMDDTHHmmss)
 * Floating time means no timezone - calendar apps interpret it as local time
 */
function formatICSDateTime(date: Date, time?: string): string {
  // Use local date components (not UTC)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  if (!time) {
    // All-day event format: YYYYMMDD
    return `${year}${month}${day}`;
  }

  // For timed events, use floating time format (no timezone conversion)
  // This ensures times display as entered in the user's local timezone
  const [hours, minutes] = time.split(":").map(Number);
  const hoursStr = String(hours).padStart(2, "0");
  const minutesStr = String(minutes).padStart(2, "0");
  const secondsStr = "00";

  // Floating time format: YYYYMMDDTHHmmss (no Z suffix)
  return `${year}${month}${day}T${hoursStr}${minutesStr}${secondsStr}`;
}

/**
 * Format date for all-day events in ICS format (YYYYMMDD)
 */
function formatICSDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

/**
 * Generate ICS content from trip and activities
 */
function generateICSContent(
  trip: { id: string; name: string; location?: string | null },
  activities: Array<{
    id: string;
    date: Date | string;
    title: string;
    startTime?: string | null;
    endTime?: string | null;
    notes?: string | null;
    done: boolean;
    transportationMode?: string | null;
    pickupTime?: string | null;
    pickupLocation?: string | null;
    dropoffLocation?: string | null;
  }>
): string {
  const lines: string[] = [];

  // Calendar header
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//Wanderly//Travel Schedule//EN");
  lines.push("CALSCALE:GREGORIAN");
  lines.push("METHOD:PUBLISH");

  // Add trip name as calendar name
  const calendarName = escapeICSText(trip.name);
  lines.push(`X-WR-CALNAME:${calendarName}`);

  // Current timestamp for DTSTAMP (use current time in UTC)
  const now = new Date();
  const dtstamp = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  // Add each activity as a VEVENT
  for (const activity of activities) {
    lines.push("BEGIN:VEVENT");

    // UID (unique identifier)
    const uid = generateEventUID(activity.id, trip.id);
    lines.push(`UID:${uid}`);

    // DTSTAMP (when the event was created/modified)
    lines.push(`DTSTAMP:${dtstamp}`);

    // Date handling
    const activityDate =
      typeof activity.date === "string"
        ? new Date(activity.date)
        : activity.date;

    if (activity.startTime) {
      // Timed event
      const dtstart = formatICSDateTime(activityDate, activity.startTime);
      lines.push(`DTSTART:${dtstart}`);

      if (activity.endTime) {
        const dtend = formatICSDateTime(activityDate, activity.endTime);
        lines.push(`DTEND:${dtend}`);
      } else {
        // If no end time, default to 1 hour after start
        const [hours, minutes] = activity.startTime.split(":").map(Number);
        const endHours = (hours + 1) % 24;
        const endTimeStr = `${String(endHours).padStart(2, "0")}:${String(
          minutes
        ).padStart(2, "0")}`;
        const dtend = formatICSDateTime(activityDate, endTimeStr);
        lines.push(`DTEND:${dtend}`);
      }
    } else {
      // All-day event
      const dateStr = formatICSDate(activityDate);
      lines.push(`DTSTART;VALUE=DATE:${dateStr}`);
      lines.push(`DTEND;VALUE=DATE:${dateStr}`);
    }

    // SUMMARY (title)
    const summary = escapeICSText(activity.title);
    lines.push(`SUMMARY:${summary}`);

    // DESCRIPTION (notes + transportation details if available)
    const descriptionParts: string[] = [];
    if (activity.notes) {
      descriptionParts.push(escapeICSText(activity.notes));
    }
    // Add transportation details to description
    if (
      activity.transportationMode ||
      activity.pickupTime ||
      activity.pickupLocation ||
      activity.dropoffLocation
    ) {
      const transportDetails: string[] = [];
      if (activity.transportationMode) {
        transportDetails.push(
          `Transportation: ${
            activity.transportationMode.charAt(0).toUpperCase() +
            activity.transportationMode.slice(1)
          }`
        );
      }
      if (activity.pickupTime) {
        const timeLabel =
          activity.transportationMode === "plane"
            ? "Departure Time"
            : "Pickup Time";
        transportDetails.push(`${timeLabel}: ${activity.pickupTime}`);
      }
      if (activity.pickupLocation) {
        const locationLabel =
          activity.transportationMode === "plane"
            ? "Departure Airport"
            : "Pickup Location";
        transportDetails.push(`${locationLabel}: ${activity.pickupLocation}`);
      }
      if (activity.dropoffLocation) {
        const locationLabel =
          activity.transportationMode === "plane"
            ? "Arrival Airport"
            : "Dropoff Location";
        transportDetails.push(`${locationLabel}: ${activity.dropoffLocation}`);
      }
      if (transportDetails.length > 0) {
        descriptionParts.push(
          `Transportation Details: ${transportDetails.join(", ")}`
        );
      }
    }
    if (descriptionParts.length > 0) {
      const description = descriptionParts.join("\\n\\n");
      lines.push(`DESCRIPTION:${description}`);
    }

    // LOCATION (trip location if available)
    if (trip.location) {
      const location = escapeICSText(trip.location);
      lines.push(`LOCATION:${location}`);
    }

    // STATUS (CANCELLED if done, otherwise CONFIRMED)
    if (activity.done) {
      lines.push("STATUS:CANCELLED");
    } else {
      lines.push("STATUS:CONFIRMED");
    }

    // SEQUENCE (for versioning, start at 0)
    lines.push("SEQUENCE:0");

    lines.push("END:VEVENT");
  }

  // Calendar footer
  lines.push("END:VCALENDAR");

  // Join lines with CRLF (required by ICS format)
  return lines.join("\r\n");
}

async function handler(req: NextRequest, auth: AuthContext) {
  try {
    const pathParts = req.nextUrl.pathname.split("/");
    const tripId = pathParts[pathParts.length - 3]; // /api/trips/[tripId]/export/ics

    if (!tripId) {
      return NextResponse.json(
        { message: "Trip ID is required" },
        { status: 400 }
      );
    }

    // Verify access
    await verifyTripAccess(auth.decodedToken, tripId);

    // Fetch trip with activities
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        activities: {
          orderBy: {
            date: "asc",
          },
        },
      },
    });

    if (!trip) {
      return NextResponse.json({ message: "Trip not found" }, { status: 404 });
    }

    // Generate ICS content
    const icsContent = generateICSContent(trip, trip.activities);

    // Create filename
    const fileName = `${trip.name.replace(/[^a-z0-9]/gi, "_")}_schedule.ics`;

    // Return file with proper headers
    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar;charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error exporting ICS:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to export calendar",
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);
