import { z } from "zod";

// Unknown fields are ignored.
export const updateUserProfileSchema = z.object({
  lastSeenWhatsNew: z.string().nullish(),
  bio: z.string().nullish(),
  travelStyle: z.string().max(200).nullish(),
  name: z.string().trim().min(1, "Name cannot be empty").optional(),
  hasCompletedOnboarding: z.boolean().optional(),
  imageUrl: z.string().nullish(),
  referralSource: z.string().nullish(),
});
export type UpdateUserProfileBody = z.infer<typeof updateUserProfileSchema>;
