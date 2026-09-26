import { formatTime12Hour } from "@/lib/utils";
import type { Activity } from "@/src/shared/types";

const TRANSPORT_ICON: Record<string, string> = {
  car: "🚗",
  bus: "🚌",
  plane: "✈️",
  train: "🚊",
  taxi: "🚕",
  walking: "🚶",
  commute: "🚌",
};

/** Every day from start to end, inclusive. */
export function tripDays(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const current = new Date(start);
  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

/** The id a day uses as a drag-and-drop target; activities dropped on it are rescheduled to that date. */
export function dayKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** The activities on a day, earliest first (untimed ones last). */
export function activitiesOn(activities: Activity[], date: Date): Activity[] {
  return activities
    .filter((activity) => sameDay(new Date(activity.date), date))
    .sort((a, b) => {
      if (!a.startTime && !b.startTime) return 0;
      if (!a.startTime) return 1;
      if (!b.startTime) return -1;
      return a.startTime.localeCompare(b.startTime);
    });
}

/** "6:30 AM" from the start time, falling back to the pickup time; null when there is neither. */
export function activityTime(activity: Activity): string | null {
  const time = activity.startTime || activity.pickupTime;
  return time ? formatTime12Hour(time) : null;
}

/** The grey line under an activity title: how you get there and where, or its notes. */
export function activitySubline(activity: Activity): string {
  const parts: string[] = [];
  if (activity.transportationMode) {
    parts.push(`${TRANSPORT_ICON[activity.transportationMode] ?? "🚗"} ${activity.transportationMode}`);
  }
  const place = activity.pickupLocation || activity.dropoffLocation;
  if (place) parts.push(place);
  if (parts.length === 0 && activity.notes) return activity.notes;
  return parts.join(" · ");
}

/** "Day 2 of 5 · 4 activities planned". */
export function dayMeta(index: number, total: number, count: number): string {
  return `Day ${index + 1} of ${total} · ${count} ${count === 1 ? "activity" : "activities"} planned`;
}

export interface MonthCell {
  /** Day of the month, or null for the blank cells before the 1st. */
  day: number | null;
  /** Position within the trip (0-based) when the day belongs to it; null otherwise. */
  tripDay: number | null;
  /** Number of activities planned that day. */
  count: number;
}

export interface MonthGrid {
  label: string;
  cells: MonthCell[];
}

const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** One Sunday-first grid for every month the trip touches, marking the trip's days and how busy each is. */
export function monthGrids(start: Date, end: Date, activities: Activity[]): MonthGrid[] {
  const days = tripDays(start, end);
  const grids: MonthGrid[] = [];
  let year = start.getFullYear();
  let month = start.getMonth();

  while (year < end.getFullYear() || (year === end.getFullYear() && month <= end.getMonth())) {
    const blanks = new Date(year, month, 1).getDay();
    const length = new Date(year, month + 1, 0).getDate();
    const cells: MonthCell[] = Array.from({ length: blanks }, () => ({ day: null, tripDay: null, count: 0 }));

    for (let day = 1; day <= length; day++) {
      const date = new Date(year, month, day);
      const tripDay = days.findIndex((d) => sameDay(d, date));
      cells.push({ day, tripDay: tripDay >= 0 ? tripDay : null, count: tripDay >= 0 ? activitiesOn(activities, date).length : 0 });
    }

    grids.push({ label: `${MONTHS_LONG[month]} ${year}`, cells });
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  return grids;
}
