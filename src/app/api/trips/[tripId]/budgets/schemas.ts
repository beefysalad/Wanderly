import { z } from "zod";

// coerce so "12.5" works, but null/""/0 all become 0 and fail `positive`.
const amountSchema = z.coerce
  .number({ error: "Amount must be a number" })
  .finite()
  .positive("Amount must be a positive number");

export const createBudgetSchema = z.object({
  amount: amountSchema,
  description: z.string().nullish(),
  category: z.string().nullish(),
  activityId: z.string().nullish(),
  isBooked: z.boolean().optional(),
});
export type CreateBudgetBody = z.infer<typeof createBudgetSchema>;

export const updateBudgetSchema = z.object({
  amount: amountSchema.optional(),
  description: z.string().nullish(),
  category: z.string().nullish(),
  activityId: z.string().nullish(),
  isBooked: z.boolean().optional(),
});
export type UpdateBudgetBody = z.infer<typeof updateBudgetSchema>;
