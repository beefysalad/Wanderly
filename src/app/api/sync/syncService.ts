import { userAuth } from "@/lib/firebase-admin";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { DecodedIdToken } from "firebase-admin/auth";
import { findUserByFirebaseId, upsertUserFromFirebase } from "./repository";

// Loaded lazily: the seeding module (and its sample data) is only needed for brand-new users.
async function seedIfNeeded(user: { id: string; hasSeededTestData: boolean }) {
  if (!user.hasSeededTestData) {
    const { seedTestData } = await import("./testDataService");
    // Awaited so the first screen a new user sees already has the sample trip.
    await seedTestData(user.id);
  }
}

/**
 * Returns the database user for a Firebase token, creating or refreshing it from Firebase when
 * the user is new (or `forceSync` is set, e.g. after a profile update).
 */
export async function syncUserToDatabaseService(
  token: DecodedIdToken,
  forceSync: boolean = false,
) {
  if (!userAuth) {
    throw new AppError("Firebase admin not initialized", 500);
  }

  const existingUser = await findUserByFirebaseId(token.uid);

  if (existingUser && !forceSync) {
    // CRITICAL: users who signed up before seeding existed still need their sample data.
    await seedIfNeeded(existingUser);
    return existingUser;
  }

  logger.info(
    forceSync
      ? "🔄 Force syncing user from Firebase after profile update"
      : "🔍 User not found, syncing from Firebase",
  );
  const firebaseUser = await userAuth.getUser(token.uid);

  const result = await upsertUserFromFirebase(token.uid, {
    email: firebaseUser.email ?? "",
    name: firebaseUser.displayName ?? "",
    imageUrl: firebaseUser.photoURL ?? "",
    disabled: firebaseUser.disabled,
  });

  await seedIfNeeded(result);

  logger.info("✅ User synced to database");
  return result;
}
