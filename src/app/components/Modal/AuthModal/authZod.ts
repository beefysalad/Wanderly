import z from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid Email Address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type TLoginSchema = z.infer<typeof loginSchema>;

export const registrationSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type TRegistrationSchema = z.infer<typeof registrationSchema>;
