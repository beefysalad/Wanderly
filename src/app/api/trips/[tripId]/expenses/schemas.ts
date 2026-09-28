import { imageUrlSchema } from "@/lib/utils/imageUrl";
import { pesoAmountSchema } from "@/lib/utils/money";
import { z } from "zod";

// Guard against z.coerce.date() turning null/"" into a valid (1970) date.
const dateInputSchema = z
  .union([z.string().min(1), z.number()], { error: "Invalid date" })
  .pipe(z.coerce.date({ error: "Invalid date" }));

// The form sends "" for "no method selected"; "cash" means the same as none.
const paymentMethodSchema = z.enum(["cash", "bank", "maya", "gcash"]).or(z.literal("")).nullish();

const optionalText = z.string().max(200).nullish();

const detailFields = {
  category: optionalText,
  paymentMethod: paymentMethodSchema,
  accountNumber: optionalText,
  bankName: optionalText,
  accountName: optionalText,
  qrImage: imageUrlSchema.nullish(),
  activityId: z.string().max(200).nullish(),
};

export const createExpenseSchema = z.object({
  paidBy: z.string().trim().min(1, "Payer is required").max(200),
  amount: pesoAmountSchema,
  description: z.string().trim().min(1, "Description is required").max(500),
  date: dateInputSchema,
  splitWith: z.array(z.string().min(1).max(200)).max(100),
  ...detailFields,
});
export type CreateExpenseBody = z.infer<typeof createExpenseSchema>;

export const updateExpenseSchema = z.object({
  paidBy: z.string().trim().min(1, "Payer cannot be empty").max(200).optional(),
  amount: pesoAmountSchema.optional(),
  description: z.string().trim().min(1, "Description cannot be empty").max(500).optional(),
  date: dateInputSchema.optional(),
  splitWith: z.array(z.string().min(1).max(200)).max(100).optional(),
  ...detailFields,
});
export type UpdateExpenseBody = z.infer<typeof updateExpenseSchema>;

export const confirmPaymentSchema = z.object({
  memberEmail: z.string().min(1, "memberEmail is required").max(200),
  status: z.enum(["confirmed", "rejected"], {
    error: "Status must be 'confirmed' or 'rejected'",
  }),
});
export type ConfirmPaymentBody = z.infer<typeof confirmPaymentSchema>;
