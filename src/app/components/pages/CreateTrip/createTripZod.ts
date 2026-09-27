import { z } from "zod";

const tripDetails = z.object({
  tripName: z.string().trim().min(1, "Trip name is required"),

  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),

  location: z.string().trim().optional(),
});

const startNotAfterEnd = (data: { startDate: string; endDate: string }) =>
  new Date(data.startDate) <= new Date(data.endDate);
const RANGE_ERROR = { message: "Start date must be before end date", path: ["startDate"] };

/** Name, place and dates: the fields shared by the create and edit trip forms. */
export const tripDetailsSchema = tripDetails.refine(startNotAfterEnd, RANGE_ERROR);
export type TTripDetailsSchema = z.infer<typeof tripDetailsSchema>;

export const createTripSchema = tripDetails
  .extend({ status: z.enum(["planning", "finalized", "ongoing", "cancelled"]) })
  .refine(startNotAfterEnd, RANGE_ERROR);

export type TCreateTripSchema = z.infer<typeof createTripSchema>;
