import { z } from "zod";

// Guard against z.coerce.date() turning null/"" into a valid (1970) date.
const dateInputSchema = z
  .union([z.string().min(1), z.number()], { error: "Invalid date" })
  .pipe(z.coerce.date({ error: "Invalid date" }));

const optionalText = z.string().nullish();

const detailFields = {
  startTime: optionalText,
  endTime: optionalText,
  notes: optionalText,
  transportationMode: optionalText,
  pickupTime: optionalText,
  pickupLocation: optionalText,
  dropoffLocation: optionalText,
};

export const createActivitySchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  date: dateInputSchema,
  ...detailFields,
});
export type CreateActivityBody = z.infer<typeof createActivitySchema>;

export const updateActivitySchema = z.object({
  title: z.string().trim().min(1, "Title cannot be empty").optional(),
  date: dateInputSchema.optional(),
  done: z.boolean().optional(),
  ...detailFields,
});
export type UpdateActivityBody = z.infer<typeof updateActivitySchema>;
