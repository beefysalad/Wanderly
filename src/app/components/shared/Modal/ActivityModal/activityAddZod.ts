import { z } from "zod";

export const activitySchema = z
  .object({
    title: z.string().trim().min(1, "Title is required"),

    date: z.string().min(1, "Date is required"), // expects "YYYY-MM-DD" string

    startTime: z.string().min(1, "Start time is required"), // "HH:MM" string
    endTime: z.string().min(1, "End time is required"), // "HH:MM" string

    notes: z.string().optional(), // optional notes
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
  );

export type TActivitySchema = z.infer<typeof activitySchema>;
