import { z } from "zod";

// Unknown fields (e.g. the onboarding wizard's `travelStyle`) are ignored, as before.
export const updateUserProfileSchema = z.object({
  lastSeenWhatsNew: z.string().nullish(),
  bio: z.string().nullish(),
  name: z.string().trim().min(1, "Name cannot be empty").optional(),
  hasCompletedOnboarding: z.boolean().optional(),
  imageUrl: z.string().nullish(),
  referralSource: z.string().nullish(),
});
export type UpdateUserProfileBody = z.infer<typeof updateUserProfileSchema>;
