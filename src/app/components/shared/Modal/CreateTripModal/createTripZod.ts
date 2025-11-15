import { z } from "zod";

export const createTripSchema = z
  .object({
    tripName: z.string().trim().min(1, "Trip name is required"),

    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),

    location: z.string().trim().optional(),
    status: z.enum(["planning", "finalized", "ongoing", "cancelled"]),
  })
  .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: "Start date must be before end date",
    path: ["startDate"],
  });

export type TCreateTripSchema = z.infer<typeof createTripSchema>;
