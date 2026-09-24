import { logger } from "@/lib/logger";
import { upsertUserProfile, type UserProfileChanges } from "./repository";
import type { UpdateUserProfileBody } from "./schemas";

interface ProfileCaller {
  uid: string;
  email?: string;
  tokenName?: string;
}

export async function updateUserProfileService(caller: ProfileCaller, data: UpdateUserProfileBody) {
  // Only fields the client actually sent are written; `undefined` means "leave as is".
  const changes: UserProfileChanges = {
    ...(data.lastSeenWhatsNew !== undefined && { lastSeenWhatsNew: data.lastSeenWhatsNew }),
    ...(data.bio !== undefined && { bio: data.bio }),
    ...(data.name !== undefined && { name: data.name }),
    ...(data.hasCompletedOnboarding !== undefined && {
      hasCompletedOnboarding: data.hasCompletedOnboarding,
    }),
    ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
    ...(data.referralSource !== undefined && { referralSource: data.referralSource }),
  };

  const user = await upsertUserProfile(caller.uid, changes, {
    firebaseId: caller.uid,
    email: caller.email || "",
    name: caller.tokenName || caller.email?.split("@")[0] || "User",
    lastSeenWhatsNew: data.lastSeenWhatsNew || "",
  });

  logger.info("User profile updated", { userId: caller.uid, fields: Object.keys(changes) });

  return user;
}
