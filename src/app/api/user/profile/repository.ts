import prisma from "@/lib/prisma";

export interface UserProfileChanges {
  lastSeenWhatsNew?: string | null;
  bio?: string | null;
  name?: string;
  hasCompletedOnboarding?: boolean;
  imageUrl?: string | null;
  referralSource?: string | null;
}

export interface NewUserRow {
  firebaseId: string;
  email: string;
  name: string;
  lastSeenWhatsNew: string;
}

/** Updates the user's profile, creating the row first if this Firebase user hasn't synced yet. */
export function upsertUserProfile(firebaseId: string, changes: UserProfileChanges, newUser: NewUserRow) {
  return prisma.user.upsert({
    where: { firebaseId },
    update: changes,
    create: newUser,
  });
}
