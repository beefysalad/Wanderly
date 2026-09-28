import { z } from "zod";

export const markPaidSchema = z.object({
  memberEmail: z.string().min(1, "memberEmail is required").max(200),
  isPaid: z.boolean({ error: "isPaid is required" }),
});
export type MarkPaidBody = z.infer<typeof markPaidSchema>;
