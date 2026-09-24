import { z } from "zod";

export const createPaymentLogSchema = z.object({
  expenseId: z.string().min(1, "Expense is required"),
  payerEmail: z.string().min(1, "Payer email is required"),
  payeeEmail: z.string().min(1, "Payee email is required"),
  amount: z.coerce
    .number({ error: "Amount must be a number" })
    .finite()
    .positive("Amount must be a positive number"),
  paymentMethod: z.enum(["cash", "bank", "maya", "gcash"]).nullish(),
});
export type CreatePaymentLogBody = z.infer<typeof createPaymentLogSchema>;
