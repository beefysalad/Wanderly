import { pesoAmountSchema } from "@/lib/utils/money";
import { z } from "zod";

export const createPaymentLogSchema = z.object({
  expenseId: z.string().min(1, "Expense is required"),
  payerEmail: z.string().min(1, "Payer email is required"),
  payeeEmail: z.string().min(1, "Payee email is required"),
  amount: pesoAmountSchema,
  paymentMethod: z.enum(["cash", "bank", "maya", "gcash"]).nullish(),
});
export type CreatePaymentLogBody = z.infer<typeof createPaymentLogSchema>;
