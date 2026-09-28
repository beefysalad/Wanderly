import { z } from "zod";

const transportationModes = [
  "commute",
  "car",
  "plane",
  "bus",
  "train",
  "taxi",
  "walking",
  "other",
] as const;

// Same rules as the API (activities/schemas.ts): 24-hour HH:mm, empty means no time.
const time = z
  .string()
  .refine((value) => value === "" || /^([01]\d|2[0-3]):[0-5]\d$/.test(value), "Use a 24-hour time like 09:30")
  .optional();

export const activitySchema = z
  .object({
    title: z.string().trim().min(1, "Title is required"),

    date: z.string().min(1, "Date is required"), // expects "YYYY-MM-DD" string

    startTime: time,
    endTime: time,

    location: z.string().trim().max(200, "Location must be 200 characters or fewer").optional(),

    notes: z.string().optional(), // optional notes

    // Transportation fields (all optional)
    transportationMode: z.enum(transportationModes).optional(),
    pickupTime: z.string().optional(), // "HH:MM" string
    pickupLocation: z.string().optional(),
    dropoffLocation: z.string().optional(),
  })
  // Either time alone is fine; an end equal to the start is allowed.
  .refine((data) => !data.startTime || !data.endTime || data.endTime >= data.startTime, {
    message: "End time can't be before the start time",
    path: ["endTime"],
  })
  // Validate pickupTime format if provided
  .refine(
    (data) => {
      if (!data.pickupTime || data.pickupTime === "") return true;
      return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(data.pickupTime);
    },
    {
      message: "Pickup time must be in HH:MM format",
      path: ["pickupTime"],
    },
  );

export type TActivitySchema = z.infer<typeof activitySchema>;
