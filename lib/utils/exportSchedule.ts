import type { Activity, Trip } from "@/src/shared/types";
import { formatTime12Hour } from "@/lib/utils";

interface ExportScheduleOptions {
  trip: Trip;
  activities: Activity[];
}

const PNG_WIDTH = 1080;
const PNG_PADDING = 56;
const PNG_HEADER_HEIGHT = 176;
const PNG_FOOTER_HEIGHT = 64;
const MAX_TITLE_LINES = 3;
const MAX_NOTES_LINES = 3;

/**
 * Exports schedule as PNG image with Wanderly branding
 */
export async function exportScheduleToPNG({
  trip,
  activities,
}: ExportScheduleOptions): Promise<void> {
  const activitiesByDate = groupActivitiesByDate(activities);
  const height = calculateCanvasHeight(trip, activitiesByDate);
  const dpr =
    typeof window !== "undefined"
      ? Math.min(window.devicePixelRatio || 1, 2)
      : 1;

  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(PNG_WIDTH * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${PNG_WIDTH}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to create canvas context");
  }

  ctx.scale(dpr, dpr);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, PNG_WIDTH, height);

  let currentY = PNG_PADDING;
  currentY = drawHeader(ctx, currentY);
  currentY = drawTripInfo(ctx, currentY, trip);
  currentY = drawActivitiesList(ctx, currentY, activitiesByDate);

  const footerY = Math.max(currentY + 24, height - PNG_FOOTER_HEIGHT);
  drawFooter(ctx, footerY, trip, activities.length);

  const blob = await canvasToBlob(canvas);
  const fileDate = toLocalDateKey(new Date());
  const safeTripName = trip.name.replace(/[^a-z0-9]/gi, "_");
  downloadBlob(blob, `${safeTripName}_itinerary_${fileDate}.png`);
}

function calculateCanvasHeight(
  trip: Trip,
  activitiesByDate: Record<string, Activity[]>
): number {
  const canvas = document.createElement("canvas");
  canvas.width = PNG_WIDTH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return 1400;
  }

  let y = PNG_PADDING;
  y += PNG_HEADER_HEIGHT + 20;
  y += getTripInfoHeight(ctx, trip);
  y += 18;
  y += getActivitiesListHeight(ctx, activitiesByDate);
  y += 24 + PNG_FOOTER_HEIGHT + PNG_PADDING;

  return Math.max(1280, Math.ceil(y));
}

function drawHeader(ctx: CanvasRenderingContext2D, y: number): number {
  const gradient = ctx.createLinearGradient(0, y, 0, y + PNG_HEADER_HEIGHT);
  gradient.addColorStop(0, "#f59e0b");
  gradient.addColorStop(1, "#ea580c");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, y, PNG_WIDTH, PNG_HEADER_HEIGHT);

  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.beginPath();
  ctx.arc(PNG_WIDTH - 120, y + 44, 86, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff7ed";
  ctx.font = "700 24px Arial";
  ctx.textAlign = "left";
  ctx.fillText("Wanderly", PNG_PADDING, y + 56);

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 44px Arial";
  ctx.fillText("Travel Itinerary", PNG_PADDING, y + 114);

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "500 20px Arial";
  ctx.fillText("Plan together. Travel lighter.", PNG_PADDING, y + 146);

  return y + PNG_HEADER_HEIGHT + 20;
}

function drawTripInfo(
  ctx: CanvasRenderingContext2D,
  y: number,
  trip: Trip
): number {
  const startDate = parseDateInput(trip.startDate);
  const endDate = parseDateInput(trip.endDate);

  const cardX = PNG_PADDING;
  const cardWidth = PNG_WIDTH - PNG_PADDING * 2;
  const innerX = cardX + 20;
  const maxTextWidth = cardWidth - 40;

  const nameHeight = getWrappedTextHeight(
    ctx,
    trip.name,
    "800 38px Arial",
    maxTextWidth,
    44,
    2
  );
  const detailsHeight = trip.location ? 58 : 30;
  const cardHeight = nameHeight + detailsHeight + 34;

  ctx.fillStyle = "#f8fafc";
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  ctx.fillRect(cardX, y, cardWidth, cardHeight);
  ctx.strokeRect(cardX, y, cardWidth, cardHeight);

  ctx.fillStyle = "#0f172a";
  drawWrappedText(ctx, trip.name, innerX, y + 50, {
    font: "800 38px Arial",
    maxWidth: maxTextWidth,
    lineHeight: 44,
    maxLines: 2,
  });

  ctx.fillStyle = "#475569";
  ctx.font = "600 19px Arial";
  ctx.textAlign = "left";
  ctx.fillText(
    `${formatDate(startDate)} - ${formatDate(endDate)}`,
    innerX,
    y + nameHeight + 14
  );

  if (trip.location) {
    drawWrappedText(ctx, `Location: ${trip.location}`, innerX, y + nameHeight + 44, {
      font: "500 18px Arial",
      maxWidth: maxTextWidth,
      lineHeight: 22,
      maxLines: 2,
      color: "#64748b",
    });
  }

  return y + cardHeight;
}

function drawActivitiesList(
  ctx: CanvasRenderingContext2D,
  y: number,
  activitiesByDate: Record<string, Activity[]>
): number {
  let currentY = y;
  const sortedDates = Object.keys(activitiesByDate).sort();

  if (sortedDates.length === 0) {
    ctx.fillStyle = "#64748b";
    ctx.font = "600 22px Arial";
    ctx.textAlign = "center";
    ctx.fillText("No activities planned yet", PNG_WIDTH / 2, currentY + 48);
    return currentY + 76;
  }

  for (const dateStr of sortedDates) {
    const date = parseDateKey(dateStr);
    const dayActivities = activitiesByDate[dateStr];
    const dateHeaderX = PNG_PADDING;
    const dateHeaderWidth = PNG_WIDTH - PNG_PADDING * 2;

    ctx.fillStyle = "#eef2ff";
    ctx.fillRect(dateHeaderX, currentY, dateHeaderWidth, 42);

    ctx.fillStyle = "#1e293b";
    ctx.font = "700 21px Arial";
    ctx.textAlign = "left";
    ctx.fillText(formatDateFull(date), dateHeaderX + 12, currentY + 28);

    currentY += 52;

    for (const activity of dayActivities) {
      const cardX = PNG_PADDING;
      const cardWidth = PNG_WIDTH - PNG_PADDING * 2;
      const textX = cardX + 42;
      const maxTextWidth = cardWidth - 62;
      const activityHeight = getActivityCardHeight(ctx, activity, maxTextWidth);

      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      ctx.fillRect(cardX, currentY, cardWidth, activityHeight);
      ctx.strokeRect(cardX, currentY, cardWidth, activityHeight);

      const checkX = cardX + 19;
      const checkY = currentY + 20;
      if (activity.done) {
        ctx.fillStyle = "#10b981";
        ctx.beginPath();
        ctx.arc(checkX, checkY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 12px Arial";
        ctx.textAlign = "center";
        ctx.fillText("✓", checkX, checkY + 4.3);
      } else {
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(checkX, checkY, 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      const titleFont = activity.done ? "italic 700 24px Arial" : "700 24px Arial";
      const titleBottomY = drawWrappedText(
        ctx,
        activity.title || "Untitled activity",
        textX,
        currentY + 30,
        {
          font: titleFont,
          maxWidth: maxTextWidth,
          lineHeight: 30,
          maxLines: MAX_TITLE_LINES,
          color: activity.done ? "#94a3b8" : "#0f172a",
        }
      );

      let detailY = titleBottomY + 8;
      if (activity.startTime) {
        const timeText = activity.endTime
          ? `${formatTime12Hour(activity.startTime)} - ${formatTime12Hour(
              activity.endTime
            )}`
          : formatTime12Hour(activity.startTime);
        ctx.fillStyle = "#475569";
        ctx.font = "600 16px Arial";
        ctx.fillText(`Time: ${timeText}`, textX, detailY);
        detailY += 22;
      }

      if (activity.transportationMode || activity.pickupTime) {
        const mode = activity.transportationMode
          ? capitalize(activity.transportationMode)
          : "Transport";
        const pickupSuffix = activity.pickupTime
          ? ` at ${formatTime12Hour(activity.pickupTime)}`
          : "";
        const transportText = `${mode}${pickupSuffix}`;
        ctx.fillStyle = "#64748b";
        ctx.font = "500 15px Arial";
        const nextY = drawWrappedText(ctx, transportText, textX, detailY, {
          font: "500 15px Arial",
          maxWidth: maxTextWidth,
          lineHeight: 19,
          maxLines: 2,
          color: "#64748b",
        });
        detailY = nextY + 4;
      }

      if (activity.notes) {
        const notesY = drawWrappedText(ctx, activity.notes, textX, detailY, {
          font: "400 15px Arial",
          maxWidth: maxTextWidth,
          lineHeight: 20,
          maxLines: MAX_NOTES_LINES,
          color: "#64748b",
        });
        detailY = notesY + 2;
      }

      if (activity.done) {
        ctx.fillStyle = "#059669";
        ctx.font = "700 13px Arial";
        ctx.fillText("COMPLETED", cardX + cardWidth - 116, currentY + 23);
      }

      currentY += activityHeight + 8;
    }

    currentY += 12;
  }

  return currentY;
}

function getTripInfoHeight(ctx: CanvasRenderingContext2D, trip: Trip): number {
  const cardWidth = PNG_WIDTH - PNG_PADDING * 2;
  const maxTextWidth = cardWidth - 40;
  const nameHeight = getWrappedTextHeight(
    ctx,
    trip.name,
    "800 38px Arial",
    maxTextWidth,
    44,
    2
  );
  return nameHeight + (trip.location ? 92 : 64);
}

function getActivitiesListHeight(
  ctx: CanvasRenderingContext2D,
  activitiesByDate: Record<string, Activity[]>
): number {
  const sortedDates = Object.keys(activitiesByDate).sort();
  if (sortedDates.length === 0) {
    return 76;
  }

  let total = 0;
  const cardWidth = PNG_WIDTH - PNG_PADDING * 2;
  const maxTextWidth = cardWidth - 62;

  for (const dateKey of sortedDates) {
    total += 52;
    for (const activity of activitiesByDate[dateKey]) {
      total += getActivityCardHeight(ctx, activity, maxTextWidth) + 8;
    }
    total += 12;
  }
  return total;
}

function getActivityCardHeight(
  ctx: CanvasRenderingContext2D,
  activity: Activity,
  maxTextWidth: number
): number {
  const titleHeight = getWrappedTextHeight(
    ctx,
    activity.title || "Untitled activity",
    activity.done ? "italic 700 24px Arial" : "700 24px Arial",
    maxTextWidth,
    30,
    MAX_TITLE_LINES
  );
  let detailHeight = 16;
  if (activity.startTime) detailHeight += 22;
  if (activity.transportationMode || activity.pickupTime) {
    detailHeight += getWrappedTextHeight(
      ctx,
      `${activity.transportationMode || "Transport"} ${activity.pickupTime || ""}`,
      "500 15px Arial",
      maxTextWidth,
      19,
      2
    );
    detailHeight += 4;
  }
  if (activity.notes) {
    detailHeight += getWrappedTextHeight(
      ctx,
      activity.notes,
      "400 15px Arial",
      maxTextWidth,
      20,
      MAX_NOTES_LINES
    );
    detailHeight += 2;
  }

  const total = 30 + titleHeight + 8 + detailHeight + 18;
  return Math.max(86, Math.ceil(total));
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  y: number,
  trip: Trip,
  activityCount: number
): void {
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, y, PNG_WIDTH, PNG_FOOTER_HEIGHT);
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(PNG_WIDTH, y);
  ctx.stroke();

  ctx.fillStyle = "#475569";
  ctx.font = "500 15px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`Trip: ${trip.name}`, PNG_PADDING, y + 25);

  ctx.fillStyle = "#64748b";
  ctx.font = "500 14px Arial";
  ctx.fillText(`Activities: ${activityCount}`, PNG_PADDING, y + 46);

  ctx.textAlign = "right";
  ctx.fillText("Generated by Wanderly", PNG_WIDTH - PNG_PADDING, y + 35);
}

function groupActivitiesByDate(
  activities: Activity[]
): Record<string, Activity[]> {
  const grouped: Record<string, Activity[]> = {};

  for (const activity of activities) {
    const dateKey = toLocalDateKey(activity.date);
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(activity);
  }

  for (const dateKey in grouped) {
    grouped[dateKey].sort((a, b) => {
      const timeA = timeToMinutes(a.startTime);
      const timeB = timeToMinutes(b.startTime);
      if (timeA !== timeB) return timeA - timeB;
      return (a.title || "").localeCompare(b.title || "");
    });
  }

  return grouped;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateFull(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  startY: number,
  options: {
    font: string;
    maxWidth: number;
    lineHeight: number;
    maxLines?: number;
    color?: string;
  }
): number {
  ctx.font = options.font;
  ctx.textAlign = "left";
  ctx.fillStyle = options.color || "#0f172a";
  const lines = wrapText(ctx, text, options.maxWidth, options.maxLines);
  let y = startY;
  for (const line of lines) {
    ctx.fillText(line, x, y);
    y += options.lineHeight;
  }
  return y;
}

function getWrappedTextHeight(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: string,
  maxWidth: number,
  lineHeight: number,
  maxLines?: number
): number {
  ctx.font = font;
  const lines = wrapText(ctx, text, maxWidth, maxLines);
  return Math.max(lineHeight, lines.length * lineHeight);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines?: number
): string[] {
  if (!text?.trim()) {
    return [""];
  }

  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width <= maxWidth) {
      currentLine = testLine;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      lines.push(truncateToWidth(ctx, word, maxWidth));
      currentLine = "";
    }

    if (maxLines && lines.length >= maxLines) {
      return addEllipsis(lines, maxLines, ctx, maxWidth);
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  if (maxLines && lines.length > maxLines) {
    return addEllipsis(lines, maxLines, ctx, maxWidth);
  }

  return lines;
}

function addEllipsis(
  lines: string[],
  maxLines: number,
  ctx: CanvasRenderingContext2D,
  maxWidth: number
): string[] {
  const clipped = lines.slice(0, maxLines);
  const last = clipped[maxLines - 1] || "";
  clipped[maxLines - 1] = truncateToWidth(ctx, `${last}...`, maxWidth);
  return clipped;
}

function truncateToWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }

  let out = text;
  while (out.length > 1 && ctx.measureText(`${out}...`).width > maxWidth) {
    out = out.slice(0, -1);
  }
  return `${out}...`;
}

function parseDateInput(dateInput: string | Date): Date {
  const date = new Date(dateInput);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function toLocalDateKey(dateInput: string | Date): string {
  const date = parseDateInput(dateInput);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function timeToMinutes(time?: string): number {
  if (!time) return Number.MAX_SAFE_INTEGER;
  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return Number.MAX_SAFE_INTEGER;
  }
  return hours * 60 + minutes;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to create image blob"));
          return;
        }
        resolve(blob);
      },
      "image/png",
      1
    );
  });
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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
 * Format date and time for ICS format using floating time (YYYYMMDDTHHmmss)
 * Floating time means no timezone - calendar apps interpret it as local time
 * @param date - Date object (local time)
 * @param time - Optional time string in HH:mm format (local time)
 * @returns Formatted date string in ICS floating time format (no timezone)
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
export async function exportScheduleToICS({
  trip,
  activities,
}: ExportScheduleOptions): Promise<void> {
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
  const icsContent = lines.join("\r\n");

  // Detect if we're on mobile Safari
  const isMobileSafari = /iPhone|iPad|iPod/.test(navigator.userAgent) && 
    /Safari/.test(navigator.userAgent) && 
    !/Chrome|CriOS|FxiOS/.test(navigator.userAgent);

  const fileName = `${trip.name.replace(/[^a-z0-9]/gi, "_")}_schedule.ics`;

  if (isMobileSafari) {
    // For mobile Safari, fetch from API endpoint which serves the file with proper headers
    // This works better than client-side blob downloads
    try {
      // Import getToken dynamically to avoid circular dependencies
      const { getToken } = await import("../helper");
      const token = await getToken();
      
      const apiUrl = `/api/trips/${trip.id}/export/ics`;
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await fetch(apiUrl, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error("Failed to export calendar file");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Create a link and trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export via API:", error);
      // Fallback to client-side generation
      const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } else {
    // For desktop browsers, use blob URL (more efficient)
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
