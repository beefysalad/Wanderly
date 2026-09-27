import { pesoAmountSchema } from "@/lib/utils/money";
import { z } from "zod";

export const createBudgetSchema = z.object({
  amount: pesoAmountSchema,
  description: z.string().nullish(),
  category: z.string().nullish(),
  activityId: z.string().nullish(),
  isBooked: z.boolean().optional(),
});
export type CreateBudgetBody = z.infer<typeof createBudgetSchema>;

export const updateBudgetSchema = z.object({
  amount: pesoAmountSchema.optional(),
  description: z.string().nullish(),
  category: z.string().nullish(),
  activityId: z.string().nullish(),
  isBooked: z.boolean().optional(),
});
export type UpdateBudgetBody = z.infer<typeof updateBudgetSchema>;
