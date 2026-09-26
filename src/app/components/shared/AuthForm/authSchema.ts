import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type TSignInSchema = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type TSignUpSchema = z.infer<typeof signUpSchema>;

/** 0–3: length, letters + numbers, then extra length or a symbol. Drives the strength meter. */
export function passwordStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[0-9]/.test(password) && /[a-zA-Z]/.test(password)) score++;
  if (password.length >= 12 || /[^a-zA-Z0-9]/.test(password)) score++;
  return score;
}
