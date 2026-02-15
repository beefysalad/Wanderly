import z from "zod";

export const editProfileSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    photo: z.instanceof(File).optional().nullable(),
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .optional()
      .or(z.literal("")),
    confirmPassword: z.string().optional(),
    bio: z
      .string()
      .max(500, "Bio must be at most 500 characters")
      .optional()
      .or(z.literal("")),
    travelStyle: z
      .string()
      .max(50, "Travel Style must be at most 50 characters")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      // If newPassword is provided, currentPassword and confirmPassword are required
      if (data.newPassword && data.newPassword.length > 0) {
        return (
          !!data.currentPassword &&
          !!data.confirmPassword &&
          data.newPassword === data.confirmPassword
        );
      }
      return true;
    },
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    },
  );

export type TEditProfileSchema = z.input<typeof editProfileSchema>;
