import z from "zod";

export const editProfileSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    photo: z.instanceof(File).optional().nullable(),
    currentPassword: z.string().optional().or(z.literal("")),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .optional()
      .or(z.literal("")),
    confirmPassword: z.string().optional().or(z.literal("")),
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
      // If newPassword is provided, currentPassword is required
      if (data.newPassword && data.newPassword.length > 0) {
        return !!data.currentPassword && data.currentPassword.length > 0;
      }
      return true;
    },
    {
      message: "Current password is required to change password",
      path: ["currentPassword"],
    },
  )
  .refine(
    (data) => {
      // If newPassword is provided, confirmPassword must match
      if (data.newPassword && data.newPassword.length > 0) {
        return data.newPassword === data.confirmPassword;
      }
      return true;
    },
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    },
  );

export type TEditProfileSchema = z.infer<typeof editProfileSchema>;
