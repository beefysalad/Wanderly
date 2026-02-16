import { z } from "zod";

export const budgetSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Amount must be a positive number",
    }),
  description: z.string().min(1, "Description is required"),
  category: z.string().optional(),
  activityId: z.string().optional(),
  isBooked: z.boolean(),
});

export type TBudgetSchema = z.infer<typeof budgetSchema>;
