import z from "zod";

export const reviewsSchema = z.object({
  rating: z
    .number()
    .min(1, "Rating must be at least 1 star")
    .max(5, "Rating must be at most 5 stars"),
  comment: z.string().min(10, "Comment must be at least 10 characters"),
  name: z.string().optional(),
  email: z.string().optional(),
});
export type TReviewsSchema = z.infer<typeof reviewsSchema>;
