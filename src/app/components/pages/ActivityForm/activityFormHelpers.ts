import type { TActivitySchema, TTransportationMode } from "./activitySchema";

export interface TripDateRange {
  startDate: string;
  endDate: string;
}

/** Every calendar day of the trip, inclusive, for the date picker. Empty when there's no trip yet. */
export function getAvailableDates(trip: TripDateRange | null | undefined): Date[] {
  if (!trip) return [];

  const dates: Date[] = [];
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  const current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export interface CreateActivityPayload {
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  notes?: string;
  transportationMode?: TTransportationMode;
  pickupTime?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
}

/** Blank optional fields become `undefined` so nothing is sent for them, matching create's "don't set it" semantics. */
export function buildCreatePayload(values: TActivitySchema): CreateActivityPayload {
  return {
    title: values.title,
    date: values.date,
    startTime: values.startTime || undefined,
    endTime: values.endTime || undefined,
    location: values.location || undefined,
    notes: values.notes || undefined,
    transportationMode: values.transportationMode ? values.transportationMode : undefined,
    pickupTime: values.pickupTime || undefined,
    pickupLocation: values.pickupLocation || undefined,
    dropoffLocation: values.dropoffLocation || undefined,
  };
}

export interface UpdateActivityPayload {
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  location: string | null;
  notes?: string;
  transportationMode: TTransportationMode | null;
  pickupTime?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
}

/** Blank `location`/`transportationMode` become `null` so the update explicitly clears them on the server. */
export function buildUpdatePayload(values: TActivitySchema): UpdateActivityPayload {
  return {
    title: values.title,
    date: values.date,
    startTime: values.startTime,
    endTime: values.endTime,
    location: values.location || null,
    notes: values.notes,
    transportationMode: values.transportationMode ? values.transportationMode : null,
    pickupTime: values.pickupTime,
    pickupLocation: values.pickupLocation,
    dropoffLocation: values.dropoffLocation,
  };
}
