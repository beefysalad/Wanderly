import { z } from "zod";

const tripStatusSchema = z.enum(["planning", "finalized", "ongoing", "cancelled"]);

// A bare `z.coerce.date()` would turn `null` into 1970-01-01 (`new Date(null)`),
// so require a non-empty string or a number before coercing.
const dateInputSchema = z
  .union([z.string().min(1), z.number()], { error: "Invalid date format" })
  .pipe(z.coerce.date({ error: "Invalid date format" }));

export const createTripSchema = z
  .object({
    tripName: z.string().trim().min(1, "Trip name is required"),
    startDate: dateInputSchema,
    endDate: dateInputSchema,
    location: z.string().trim().nullish(),
    status: tripStatusSchema.optional().default("planning"),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: "Start date must be before end date",
    path: ["endDate"],
  });
export type CreateTripBody = z.infer<typeof createTripSchema>;

export const updateTripSchema = z.object({
  name: z.string().trim().min(1, "Trip name cannot be empty").optional(),
  startDate: dateInputSchema.optional(),
  endDate: dateInputSchema.optional(),
  location: z.string().trim().nullish(),
  status: tripStatusSchema.optional(),
});
export type UpdateTripBody = z.infer<typeof updateTripSchema>;
