import { z } from "zod";

const tripStatusSchema = z.enum(["planning", "finalized", "ongoing", "cancelled"]);

export const createTripSchema = z
  .object({
    tripName: z.string().trim().min(1, "Trip name is required"),
    startDate: z.coerce.date({ error: "Invalid date format" }),
    endDate: z.coerce.date({ error: "Invalid date format" }),
    location: z.string().trim().optional(),
    status: tripStatusSchema.optional().default("planning"),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: "Start date must be before end date",
    path: ["endDate"],
  });
export type CreateTripBody = z.infer<typeof createTripSchema>;

export const updateTripSchema = z.object({
  name: z.string().trim().min(1, "Trip name cannot be empty").optional(),
  startDate: z.coerce.date({ error: "Invalid date format" }).optional(),
  endDate: z.coerce.date({ error: "Invalid date format" }).optional(),
  location: z.string().trim().optional(),
  status: tripStatusSchema.optional(),
});
export type UpdateTripBody = z.infer<typeof updateTripSchema>;
