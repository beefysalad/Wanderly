import type { Activity, Trip } from "@/src/shared/types";
import { formatTime12Hour } from "@/lib/utils";

interface ExportScheduleOptions {
  trip: Trip;
  activities: Activity[];
}

/**
 * Exports schedule as PNG image with Wanderly branding
 */
export async function exportScheduleToPNG({
  trip,
  activities,
}: ExportScheduleOptions): Promise<void> {
  // Canvas dimensions (optimized for mobile viewing)
  const width = 800;
  const padding = 40;
  const headerHeight = 180;
  const footerHeight = 60;

  // Calculate content height dynamically
  // We'll start with a base height and adjust as we draw
  const baseHeight = headerHeight + 100 + footerHeight + padding * 2;
  const height = Math.max(1200, baseHeight + activities.length * 80);

  // Create canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to create canvas context");
  }

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  let currentY = padding;

  // Group activities by date
  const activitiesByDate = groupActivitiesByDate(activities);

  // Header with Wanderly branding
  currentY = drawHeader(ctx, width, currentY);

  // Trip info
  currentY = drawTripInfo(ctx, width, currentY, padding, trip);

  // Activities list
  currentY = drawActivitiesList(
    ctx,
    width,
    currentY,
    padding,
    activitiesByDate
  );

  // Footer (positioned at the end of content, but within canvas bounds)
  const footerY = Math.min(currentY + 20, height - footerHeight);
  drawFooter(ctx, width, footerY);

  // Convert to blob and download
  canvas.toBlob(
    (blob) => {
      if (!blob) {
        throw new Error("Failed to create image blob");
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${trip.name.replace(/[^a-z0-9]/gi, "_")}_schedule_${
        new Date().toISOString().split("T")[0]
      }.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    "image/png",
    1.0
  );
}

/**
 * Draw Wanderly branding header
 */
function drawHeader(
  ctx: CanvasRenderingContext2D,
  width: number,
  y: number
): number {
  const headerHeight = 140;
  const gradient = ctx.createLinearGradient(0, y, 0, y + headerHeight);
  gradient.addColorStop(0, "#fbbf24"); // amber-400
  gradient.addColorStop(1, "#f97316"); // orange-500

  // Header background
  ctx.fillStyle = gradient;
  ctx.fillRect(0, y, width, headerHeight);

  // Compass icon (simplified as text/emoji or geometric shape)
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 48px Arial";
  ctx.textAlign = "center";
  ctx.fillText("🧭", width / 2, y + 50);

  // Wanderly text
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 36px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Wanderly", width / 2, y + 95);

  // Tagline
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.font = "16px Arial";
  ctx.fillText("Plan your trip", width / 2, y + 120);

  return y + headerHeight + 20;
}

/**
 * Draw trip information
 */
function drawTripInfo(
  ctx: CanvasRenderingContext2D,
  width: number,
  y: number,
  padding: number,
  trip: Trip
): number {
  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);

  // Trip name
  ctx.fillStyle = "#1e293b"; // slate-800
  ctx.font = "bold 28px Arial";
  ctx.textAlign = "left";
  ctx.fillText(trip.name, padding, y);

  // Date range
  ctx.fillStyle = "#64748b"; // slate-500
  ctx.font = "18px Arial";
  const dateText = `${formatDate(startDate)} - ${formatDate(endDate)}`;
  ctx.fillText(dateText, padding, y + 35);

  // Location (if available)
  if (trip.location) {
    ctx.fillStyle = "#64748b";
    ctx.font = "16px Arial";
    ctx.fillText(`📍 ${trip.location}`, padding, y + 60);
    return y + 90;
  }

  return y + 60;
}

/**
 * Draw activities list grouped by date
 */
function drawActivitiesList(
  ctx: CanvasRenderingContext2D,
  width: number,
  y: number,
  padding: number,
  activitiesByDate: Record<string, Activity[]>
): number {
  let currentY = y;

  const sortedDates = Object.keys(activitiesByDate).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  if (sortedDates.length === 0) {
    ctx.fillStyle = "#94a3b8"; // slate-400
    ctx.font = "18px Arial";
    ctx.textAlign = "center";
    ctx.fillText("No activities planned", width / 2, currentY + 30);
    return currentY + 60;
  }

  for (const dateStr of sortedDates) {
    const date = new Date(dateStr);
    const dayActivities = activitiesByDate[dateStr];

    // Date header
    ctx.fillStyle = "#f1f5f9"; // slate-100
    ctx.fillRect(padding, currentY, width - padding * 2, 40);

    ctx.fillStyle = "#1e293b"; // slate-800
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "left";
    const dateText = formatDateFull(date);
    ctx.fillText(dateText, padding + 10, currentY + 28);

    currentY += 50;

    // Activities for this date
    for (const activity of dayActivities) {
      const titleX = padding + 35;
      const maxTitleWidth = width - padding * 2 - 50;

      // First, calculate the height needed for all content
      let contentHeight = 20; // Top padding

      // Title height
      ctx.font = activity.done ? "italic 18px Arial" : "bold 18px Arial";
      const titleLines = wrapText(ctx, activity.title, maxTitleWidth);
      contentHeight += Math.min(titleLines.length, 2) * 22;
      if (titleLines.length > 2) {
        contentHeight += 22; // For "..."
      }

      // Time height
      if (activity.startTime) {
        contentHeight += 20;
      }

      // Notes height
      if (activity.notes) {
        ctx.font = "14px Arial";
        const notesLines = wrapText(ctx, activity.notes, maxTitleWidth);
        contentHeight += Math.min(notesLines.length, 2) * 18;
        if (notesLines.length > 2) {
          contentHeight += 18; // For "..."
        }
      }

      contentHeight += 10; // Bottom padding
      const activityHeight = Math.max(60, contentHeight);

      // Draw activity background with calculated height
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#e2e8f0"; // slate-200
      ctx.lineWidth = 1;
      ctx.fillRect(padding, currentY, width - padding * 2, activityHeight);
      ctx.strokeRect(padding, currentY, width - padding * 2, activityHeight);

      // Done indicator
      const checkX = padding + 15;
      const checkY = currentY + 20;
      if (activity.done) {
        ctx.fillStyle = "#10b981"; // emerald-500
        ctx.beginPath();
        ctx.arc(checkX, checkY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.fillText("✓", checkX, checkY + 4);
      } else {
        ctx.strokeStyle = "#cbd5e1"; // slate-300
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(checkX, checkY, 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Activity title (with wrapping)
      ctx.fillStyle = activity.done ? "#94a3b8" : "#1e293b";
      ctx.font = activity.done ? "italic 18px Arial" : "bold 18px Arial";
      ctx.textAlign = "left";
      let textY = currentY + 20;
      for (let i = 0; i < Math.min(titleLines.length, 2); i++) {
        ctx.fillText(titleLines[i], titleX, textY);
        textY += 22;
      }
      if (titleLines.length > 2) {
        ctx.fillText("...", titleX, textY);
        textY += 22;
      }

      // Time and notes
      let detailY = textY;
      ctx.fillStyle = "#64748b";
      ctx.font = "14px Arial";

      if (activity.startTime) {
        const timeText = activity.endTime
          ? `${formatTime12Hour(activity.startTime)} - ${formatTime12Hour(
              activity.endTime
            )}`
          : formatTime12Hour(activity.startTime);
        ctx.fillText(`⏰ ${timeText}`, titleX, detailY);
        detailY += 20;
      }

      if (activity.notes) {
        ctx.font = "14px Arial";
        const notesLines = wrapText(ctx, activity.notes, maxTitleWidth);
        for (let i = 0; i < Math.min(notesLines.length, 2); i++) {
          ctx.fillText(notesLines[i], titleX, detailY);
          detailY += 18;
        }
        if (notesLines.length > 2) {
          ctx.fillText("...", titleX, detailY);
          detailY += 18;
        }
      }

      currentY += activityHeight;
    }

    currentY += 10; // Spacing between dates
  }

  return currentY;
}

/**
 * Draw footer with branding
 */
function drawFooter(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const footerY = height - 40;
  ctx.fillStyle = "#f8fafc"; // slate-50
  ctx.fillRect(0, footerY, width, 40);

  ctx.fillStyle = "#94a3b8"; // slate-400
  ctx.font = "14px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Generated by Wanderly", width / 2, footerY + 25);
}

/**
 * Group activities by date
 */
function groupActivitiesByDate(
  activities: Activity[]
): Record<string, Activity[]> {
  const grouped: Record<string, Activity[]> = {};

  for (const activity of activities) {
    const date = new Date(activity.date);
    const dateKey = date.toISOString().split("T")[0];
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(activity);
  }

  // Sort activities within each date by start time
  for (const dateKey in grouped) {
    grouped[dateKey].sort((a, b) => {
      const timeA = a.startTime || "";
      const timeB = b.startTime || "";
      return timeA.localeCompare(timeB);
    });
  }

  return grouped;
}

/**
 * Format date as "Mon, Jan 15, 2025"
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format date as "Monday, January 15, 2025"
 */
function formatDateFull(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Wrap text to fit within max width and return lines array
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  if (!text) return [];

  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine + (currentLine ? " " : "") + words[i];
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [text];
}

/**
 * Escape text for ICS format (escape commas, semicolons, newlines, backslashes)
 */
function escapeICSText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\\/g, "\\\\") // Escape backslashes first
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");
}

/**
 * Generate a unique UID for ICS events
 */
function generateEventUID(activityId: string, tripId: string): string {
  // Format: wanderly-{tripId}-{activityId}@wanderly.app
  return `wanderly-${tripId}-${activityId}@wanderly.app`;
}

/**
 * Format date and time for ICS format (YYYYMMDDTHHmmssZ)
 * @param date - Date object (local time)
 * @param time - Optional time string in HH:mm format (local time)
 * @returns Formatted date string in ICS format (UTC)
 */
function formatICSDateTime(date: Date, time?: string): string {
  // Use local date components
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  if (!time) {
    // All-day event format: YYYYMMDD
    return `${year}${month}${day}`;
  }

  // For timed events, create a Date object with the local date and time
  // then convert to UTC for ICS format
  const [hours, minutes] = time.split(":").map(Number);
  const localDate = new Date(date);
  localDate.setHours(hours, minutes, 0, 0);
  
  // Convert to UTC
  const utcYear = localDate.getUTCFullYear();
  const utcMonth = String(localDate.getUTCMonth() + 1).padStart(2, "0");
  const utcDay = String(localDate.getUTCDate()).padStart(2, "0");
  const utcHours = String(localDate.getUTCHours()).padStart(2, "0");
  const utcMinutes = String(localDate.getUTCMinutes()).padStart(2, "0");
  const utcSeconds = "00";

  // Timed event format: YYYYMMDDTHHmmssZ
  return `${utcYear}${utcMonth}${utcDay}T${utcHours}${utcMinutes}${utcSeconds}Z`;
}

/**
 * Format date for all-day events in ICS format (YYYYMMDD)
 * Uses local date components (not UTC) for all-day events
 */
function formatICSDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

/**
 * Exports schedule as .ics calendar file
 */
export function exportScheduleToICS({
  trip,
  activities,
}: ExportScheduleOptions): void {
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
    const activityDate = new Date(activity.date);
    
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
        const endTimeStr = `${String(endHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
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

    // DESCRIPTION (notes if available)
    if (activity.notes) {
      const description = escapeICSText(activity.notes);
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
  const icsContent = lines.join("\r\n");

  // Create blob and download
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${trip.name.replace(/[^a-z0-9]/gi, "_")}_schedule.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
