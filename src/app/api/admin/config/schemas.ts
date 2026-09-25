import { z } from "zod";

export const upsertConfigSchema = z.object({
  key: z
    .string()
    .min(1, "Key is required")
    .refine((key) => key !== "admin_password", "This key is no longer used"),
  // `value` is a non-null Json column, so it must be present and JSON-serialisable.
  value: z.json().refine((value) => value !== null, "Value is required"),
});
export type UpsertConfigBody = z.infer<typeof upsertConfigSchema>;
