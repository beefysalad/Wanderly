import { z } from "zod";

// Guard against z.coerce.date() turning null/"" into a valid (1970) date.
const dateInputSchema = z
  .union([z.string().min(1), z.number()], { error: "Invalid date" })
  .pipe(z.coerce.date({ error: "Invalid date" }));

const amountSchema = z.coerce
  .number({ error: "Amount must be a number" })
  .finite()
  .positive("Amount must be a positive number");

// The form sends "" for "no method selected"; "cash" means the same as none.
const paymentMethodSchema = z.enum(["cash", "bank", "maya", "gcash"]).or(z.literal("")).nullish();

const optionalText = z.string().nullish();

const detailFields = {
  category: optionalText,
  paymentMethod: paymentMethodSchema,
  accountNumber: optionalText,
  bankName: optionalText,
  accountName: optionalText,
  qrImage: optionalText,
  activityId: optionalText,
};

export const createExpenseSchema = z.object({
  paidBy: z.string().trim().min(1, "Payer is required"),
  amount: amountSchema,
  description: z.string().trim().min(1, "Description is required"),
  date: dateInputSchema,
  splitWith: z.array(z.string().min(1)),
  ...detailFields,
});
export type CreateExpenseBody = z.infer<typeof createExpenseSchema>;

export const updateExpenseSchema = z.object({
  paidBy: z.string().trim().min(1, "Payer cannot be empty").optional(),
  amount: amountSchema.optional(),
  description: z.string().trim().min(1, "Description cannot be empty").optional(),
  date: dateInputSchema.optional(),
  splitWith: z.array(z.string().min(1)).optional(),
  ...detailFields,
});
export type UpdateExpenseBody = z.infer<typeof updateExpenseSchema>;

export const confirmPaymentSchema = z.object({
  memberEmail: z.string().min(1, "memberEmail is required"),
  status: z.enum(["confirmed", "rejected"], {
    error: "Status must be 'confirmed' or 'rejected'",
  }),
});
export type ConfirmPaymentBody = z.infer<typeof confirmPaymentSchema>;
