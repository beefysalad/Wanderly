import { z } from "zod";

export const listReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(10000).default(10),
  rating: z.coerce.number().int().min(1).max(5).optional(),
});

export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;
