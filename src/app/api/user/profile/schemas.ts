import { imageUrlSchema } from "@/src/lib/utils/imageUrl";
import { z } from "zod";

// Unknown fields are ignored.
export const updateUserProfileSchema = z.object({
  lastSeenWhatsNew: z.string().nullish(),
  bio: z.string().max(2000).nullish(),
  travelStyle: z.string().max(200).nullish(),
  name: z.string().trim().min(1, "Name cannot be empty").max(200).optional(),
  hasCompletedOnboarding: z.boolean().optional(),
  imageUrl: imageUrlSchema.nullish(),
  referralSource: z.string().max(200).nullish(),
});
export type UpdateUserProfileBody = z.infer<typeof updateUserProfileSchema>;
