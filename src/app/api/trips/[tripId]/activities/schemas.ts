import { z } from "zod";

// Guard against z.coerce.date() turning null/"" into a valid (1970) date.
const dateInputSchema = z
  .union([z.string().min(1), z.number()], { error: "Invalid date" })
  .pipe(z.coerce.date({ error: "Invalid date" }));

const optionalText = z.string().nullish();

const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;
// "" and null both mean "no time" (the service stores null).
const timeField = z
  .string()
  .refine((value) => value === "" || HH_MM.test(value), "Use a 24-hour time like 09:30")
  .nullish();

export const LOCATION_MAX_LENGTH = 200;

export const TIME_ORDER_MESSAGE = "End time can't be before the start time";

/**
 * False only when both times are set and the end is earlier; either one alone is fine, and an end
 * equal to the start is allowed. Activities can't cross midnight. HH:mm compares correctly as text.
 */
export function timesInOrder(start?: string | null, end?: string | null): boolean {
  return !start || !end || end >= start;
}

const timeOrderIssue = { message: TIME_ORDER_MESSAGE, path: ["endTime"] };

const detailFields = {
  startTime: timeField,
  endTime: timeField,
  location: z
    .string()
    .trim()
    .max(LOCATION_MAX_LENGTH, `Location must be ${LOCATION_MAX_LENGTH} characters or fewer`)
    .nullish(),
  notes: optionalText,
  transportationMode: optionalText,
  pickupTime: optionalText,
  pickupLocation: optionalText,
  dropoffLocation: optionalText,
};

export const createActivitySchema = z
  .object({
    title: z.string().trim().min(1, "Title is required"),
    date: dateInputSchema,
    ...detailFields,
  })
  .refine((data) => timesInOrder(data.startTime, data.endTime), timeOrderIssue);
export type CreateActivityBody = z.infer<typeof createActivitySchema>;

// When only one time is sent, the service checks it against the stored other one.
export const updateActivitySchema = z
  .object({
    title: z.string().trim().min(1, "Title cannot be empty").optional(),
    date: dateInputSchema.optional(),
    done: z.boolean().optional(),
    ...detailFields,
  })
  .refine((data) => timesInOrder(data.startTime, data.endTime), timeOrderIssue);
export type UpdateActivityBody = z.infer<typeof updateActivitySchema>;
