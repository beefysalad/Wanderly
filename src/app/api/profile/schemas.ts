import { z } from "zod";

export const updateProfileSchema = z
  .object({
    name: z.string().min(1).optional(),
    photoURL: z.string().url().optional(),
    bio: z.string().max(500).optional(),
    travelStyle: z.string().max(50).optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.photoURL !== undefined ||
      data.bio !== undefined ||
      data.travelStyle !== undefined,
    {
      message:
        "At least one field (name, photoURL, bio, or travelStyle) must be provided",
    },
  );

export type UpdateProfileBody = z.infer<typeof updateProfileSchema>;

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export type UpdatePasswordBody = z.infer<typeof updatePasswordSchema>;
