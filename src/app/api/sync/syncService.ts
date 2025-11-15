import { userAuth } from "@/lib/firebase-admin";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { DecodedIdToken } from "firebase-admin/auth";

export async function syncUserToDatabaseService(token: DecodedIdToken) {
  if (!userAuth) {
    throw new Error("Firebase admin not initialized");
  }

  // First, try to find the user in the database by firebaseId
  const existingUser = await prisma.user.findUnique({
    where: { firebaseId: token.uid },
  });

  // If user exists and we have their email, we can skip Firebase fetch for most cases
  // Only fetch from Firebase if user doesn't exist or we need to verify/update
  if (existingUser) {
    // User exists, only update if we suspect changes (e.g., after profile updates)
    // For now, we'll do a lightweight check - only fetch from Firebase if needed
    // In most cases, we can just return the existing user
    return existingUser;
  }

  // User doesn't exist, fetch from Firebase and create
  logger.info("🔍 User not found, syncing from Firebase");
  const firebaseUser = await userAuth.getUser(token.uid);
  const firebaseUserData = {
    email: firebaseUser.email ?? "",
    name: firebaseUser.displayName ?? "",
    imageUrl: firebaseUser.photoURL ?? "",
  };

  const result = await prisma.user.upsert({
    where: {
      email: firebaseUser.email ?? "",
    },
    create: {
      ...firebaseUserData,
      firebaseId: token.uid,
    },
    update: {
      ...firebaseUserData,
      firebaseId: token.uid,
      firebaseDisabled: firebaseUser.disabled,
    },
  });
  logger.info("✅ User synced to database");
  return result;
}
