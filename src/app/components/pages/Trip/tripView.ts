import { formatTime12Hour } from "@/src/lib/utils";
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

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/**
 * The id a day uses as a drag-and-drop target; activities dropped on it are rescheduled to that date.
 * Built from local parts so it names the same day `activitiesOn` groups by.
 */
export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

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

/**
 * The date to reschedule a dragged activity to, or null when the drop leaves it on its own day.
 * `overId` is either a day's `dayKey` or the id of the activity it was dropped on.
 */
export function dropDate(moved: Activity, overId: string, activities: Activity[]): string | null {
  const movedDay = new Date(moved.date);
  if (/^\d{4}-\d{2}-\d{2}$/.test(overId)) return dayKey(movedDay) !== overId ? overId : null;

  const target = activities.find((activity) => activity.id === overId);
  if (!target || target.id === moved.id || sameDay(movedDay, new Date(target.date))) return null;
  return target.date;
}

/**
 * The `<input type="date">` value for a stored trip date. Trip dates are saved from that input as
 * UTC midnight, so the UTC day is the one that was picked; the local day would be a day earlier
 * west of UTC and move the trip back on every unchanged save.
 */
export function dateInputValue(iso: string): string {
  return iso.slice(0, 10);
}

/**
 * The activities a trip running from `start` to `end` (date-input values) would leave off its
 * itinerary, judged by the same local days `tripDays` and `activitiesOn` show. Empty while either
 * date is missing.
 */
export function activitiesOutside(activities: Activity[], start: string, end: string): Activity[] {
  const from = new Date(start);
  const to = new Date(end);
  if (isNaN(from.getTime()) || isNaN(to.getTime())) return [];
  const first = dayKey(from);
  const last = dayKey(to);
  return activities.filter((activity) => {
    const day = dayKey(new Date(activity.date));
    return day < first || day > last;
  });
}

/**
 * Ids of the activities whose times clash with another on the same (local, as shown) day. An
 * activity without an end time is a moment at its start; untimed ones never clash. Back-to-back
 * ranges don't clash; two activities starting at the same time do.
 */
export function overlappingActivityIds(activities: Activity[]): Set<string> {
  const byDay = new Map<string, { id: string; start: string; end: string }[]>();
  for (const activity of activities) {
    if (!activity.startTime) continue;
    const key = dayKey(new Date(activity.date));
    const slots = byDay.get(key) ?? [];
    // Guard against a stored end before the start (older rows) so it still reads as a moment.
    const end = activity.endTime && activity.endTime > activity.startTime ? activity.endTime : activity.startTime;
    slots.push({ id: activity.id, start: activity.startTime, end });
    byDay.set(key, slots);
  }

  const clashing = new Set<string>();
  for (const slots of byDay.values()) {
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const a = slots[i];
        const b = slots[j];
        if (a.start === b.start || (a.start < b.end && b.start < a.end)) {
          clashing.add(a.id);
          clashing.add(b.id);
        }
      }
    }
  }
  return clashing;
}

/** A Google Maps search for a place, which opens the Maps app on phones. */
export function mapsSearchUrl(location: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
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
