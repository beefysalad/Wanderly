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

export const activitySchema = z
  .object({
    title: z.string().trim().min(1, "Title is required"),

    date: z.string().min(1, "Date is required"), // expects "YYYY-MM-DD" string

    startTime: z.string().min(1, "Start time is required"), // "HH:MM" string
    endTime: z.string().min(1, "End time is required"), // "HH:MM" string

    notes: z.string().optional(), // optional notes

    // Transportation fields (all optional)
    // Convert empty strings to undefined for enum validation
    transportationMode: z
      .preprocess(
        (val) => (val === "" || val === null ? undefined : val),
        z.enum(transportationModes).optional()
      ),
    pickupTime: z.preprocess(
      (val) => (val === "" || val === null ? undefined : val),
      z.string().optional()
    ), // "HH:MM" string
    pickupLocation: z.preprocess(
      (val) => (val === "" || val === null ? undefined : val),
      z.string().optional()
    ),
    dropoffLocation: z.preprocess(
      (val) => (val === "" || val === null ? undefined : val),
      z.string().optional()
    ),
  })
  // Optional refinement to ensure startTime <= endTime
  .refine(
    (data) => {
      if (!data.startTime || !data.endTime) return true; // skip if either is empty
      return data.startTime <= data.endTime;
    },
    {
      message: "Start time must be before end time",
      path: ["startTime"],
    }
  )
  // Validate pickupTime format if provided
  .refine(
    (data) => {
      if (!data.pickupTime || data.pickupTime === "") return true;
      return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(data.pickupTime);
    },
    {
      message: "Pickup time must be in HH:MM format",
      path: ["pickupTime"],
    }
  );

export type TActivitySchema = z.infer<typeof activitySchema>;
