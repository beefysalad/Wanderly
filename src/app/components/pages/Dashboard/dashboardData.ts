import type { Group, Trip } from "@/src/shared/types";

export type TripWithGroup = Trip & { group: Group };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Local midnight of a date (trip dates arrive as ISO strings). */
export function dayStart(value: Date | string): Date {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Whole days from a to b (negative when b is earlier). */
export function dayDiff(a: Date, b: Date): number {
  return Math.round((dayStart(b).getTime() - dayStart(a).getTime()) / 864e5);
}

export function allTrips(groups: Group[]): TripWithGroup[] {
  return groups.flatMap((group) => (group.trips ?? []).map((trip) => ({ ...trip, group })));
}

const startOf = (trip: Trip) => dayStart(trip.startDate);
const endOf = (trip: Trip) => dayStart(trip.endDate);

/** Trips that haven't finished yet (running or still to come), soonest first. Cancelled trips are left out. */
export function upcomingTrips(trips: TripWithGroup[], today: Date): TripWithGroup[] {
  const from = dayStart(today);
  return trips
    .filter((trip) => trip.status !== "cancelled" && endOf(trip) >= from)
    .sort((a, b) => startOf(a).getTime() - startOf(b).getTime());
}

export function pastTrips(trips: TripWithGroup[], today: Date): TripWithGroup[] {
  const from = dayStart(today);
  return trips
    .filter((trip) => endOf(trip) < from)
    .sort((a, b) => startOf(b).getTime() - startOf(a).getTime());
}

/** "Past", "Happening now", "Tomorrow" or "in N days". */
export function tripWhen(trip: Trip, today: Date): string {
  if (endOf(trip) < dayStart(today)) return "Past";
  if (startOf(trip) <= dayStart(today)) return "Happening now";
  const days = dayDiff(today, startOf(trip));
  return days === 1 ? "Tomorrow" : `in ${days} days`;
}

/** The big number and its caption for a trip's countdown tile. */
export function tripCountdown(trip: Trip, today: Date): { big: string; small: string } {
  if (startOf(trip) <= dayStart(today)) return { big: "Now", small: " happening" };
  const days = dayDiff(today, startOf(trip));
  return { big: String(days), small: days === 1 ? " day to go" : " days to go" };
}

/** "Oct 8 – 12" within a month, "Oct 30 – Nov 2" across months. */
export function shortRange(trip: Trip): string {
  const start = startOf(trip);
  const end = endOf(trip);
  return start.getMonth() === end.getMonth()
    ? `${MONTHS[start.getMonth()]} ${start.getDate()} – ${end.getDate()}`
    : `${MONTHS[start.getMonth()]} ${start.getDate()} – ${MONTHS[end.getMonth()]} ${end.getDate()}`;
}

/** "Oct 8 – 12, 2026". */
export function fullRange(trip: Trip): string {
  return `${shortRange(trip)}, ${endOf(trip).getFullYear()}`;
}

/** "5 days · 15 activities". */
export function tripMeta(trip: Trip): string {
  const days = dayDiff(startOf(trip), endOf(trip)) + 1;
  const activities = trip.activities?.length ?? 0;
  return `${days} ${days === 1 ? "day" : "days"} · ${activities} ${activities === 1 ? "activity" : "activities"}`;
}

/** "Saturday · Sep 26". */
export function dateEyebrow(date: Date): string {
  return `${WEEKDAYS_LONG[date.getDay()]} · ${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

export function monthLabel(year: number, month: number): string {
  return `${MONTHS_LONG[month]} ${year}`;
}

/** "OCT" and "8", for the little date tile in the agenda. */
export function dateTile(trip: Trip): { month: string; day: number } {
  const start = startOf(trip);
  return { month: MONTHS[start.getMonth()].toUpperCase(), day: start.getDate() };
}

export interface CalendarCell {
  /** 1–31, or null for the blank cells before the 1st. */
  day: number | null;
  isToday: boolean;
  /** Colour schemes of the trips covering this day (first one tints the cell, up to three become bars). */
  schemes: string[];
}

/** A Sunday-first month grid with the trips that cover each day. */
export function buildMonthCells(year: number, month: number, trips: TripWithGroup[], today: Date): CalendarCell[] {
  const blanks = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: CalendarCell[] = Array.from({ length: blanks }, () => ({ day: null, isToday: false, schemes: [] }));

  for (let day = 1; day <= days; day++) {
    const date = new Date(year, month, day);
    cells.push({
      day,
      isToday: dayDiff(today, date) === 0,
      schemes: trips
        .filter((trip) => date >= startOf(trip) && date <= endOf(trip))
        .slice(0, 3)
        .map((trip) => trip.group.colorScheme ?? "orange"),
    });
  }
  return cells;
}
