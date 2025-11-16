import { z } from "zod";

export const expenseSchema = z
  .object({
    paidBy: z.string().min(1, "Paid by is required"),

    amount: z
      .string()
      .min(1, "Amount is required")
      .refine((val) => !isNaN(Number(val)), "Amount must be a valid number"),

    description: z.string().min(1, "Description is required"),

    date: z.string().min(1, "Date is required"),

    category: z.string().min(1, "Category is required"),

    splitWith: z.array(z.string()),

    paymentMethod: z.enum(["cash", "bank", "maya", "gcash", ""]),

    accountNumber: z.string().optional(),
    bankName: z.string().optional(),
    accountName: z.string().optional(),
    qrImage: z.string().optional(),
    activityId: z.string().optional(),
  })

  // CONDITIONAL: accountNumber required ONLY when bank/maya/gcash
  .refine(
    (data) => {
      if (data.paymentMethod === "" || data.paymentMethod === "cash") {
        return true; // skip validation for these cases
      }
      return !!data.accountNumber && data.accountNumber.trim().length > 0;
    },
    {
      path: ["accountNumber"],
      message: "Account number is required for bank, maya, or gcash",
    }
  );
export type TExpenseSchema = z.infer<typeof expenseSchema>;
