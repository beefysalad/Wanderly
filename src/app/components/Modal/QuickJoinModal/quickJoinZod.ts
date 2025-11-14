import z from "zod";

export const codeSchema = z.object({
  code: z.string().min(1, "Code is required"),
});
export type TCodeSchema = z.infer<typeof codeSchema>;

export const guestNameSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export type TGuestSchema = z.infer<typeof guestNameSchema>;
