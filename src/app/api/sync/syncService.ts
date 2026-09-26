import { userAuth } from "@/lib/firebase-admin";
import { AppError, ForbiddenError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { Prisma } from "@prisma/client";
import type { DecodedIdToken } from "firebase-admin/auth";
import {
  createUserFromFirebase,
  findUserByEmail,
  findUserByFirebaseId,
  updateUserFromFirebase,
  type FirebaseProfile,
} from "./repository";
import { DUMMY_USERS } from "./sampleTripData";

// Loaded lazily: the seeding module is only needed for brand-new users.
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
 *
 * Rows are matched by Firebase uid. An existing row is attached to a different Firebase account
 * through its email only when Firebase has verified that the caller owns that email; otherwise
 * anyone could register an unverified account with someone else's email and take over their row.
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
  if (!firebaseUser.email) {
    throw new ForbiddenError("An email address is required to use Wanderly");
  }

  const profile: FirebaseProfile = {
    email: firebaseUser.email,
    name: firebaseUser.displayName ?? "",
    imageUrl: firebaseUser.photoURL ?? "",
    disabled: firebaseUser.disabled,
  };

  const result = existingUser
    ? await updateUserFromFirebase(existingUser.id, token.uid, profile)
    : await createOrLinkUser(token.uid, profile, firebaseUser.emailVerified);

  await seedIfNeeded(result);

  logger.info("✅ User synced to database");
  return result;
}

async function createOrLinkUser(firebaseId: string, profile: FirebaseProfile, emailVerified: boolean) {
  // The sample-data members are shared by every seeded group, so nobody may own their emails.
  if (DUMMY_USERS.some((d) => d.email === profile.email.toLowerCase())) {
    throw new ForbiddenError("This email address can't be used");
  }

  const emailOwner = await findUserByEmail(profile.email);
  if (!emailOwner) {
    try {
      return await createUserFromFirebase(firebaseId, profile);
    } catch (error) {
      // A new user's first page load syncs from several requests at once; one of them wins the insert.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const created = await findUserByFirebaseId(firebaseId);
        if (created) return created;
      }
      throw error;
    }
  }
  if (!emailVerified) {
    logger.warn("Refused to link a Firebase account to an existing user with an unverified email", {
      userId: emailOwner.id,
    });
    throw new ForbiddenError(
      "An account with this email already exists. Sign in with the method you used before.",
    );
  }
  return updateUserFromFirebase(emailOwner.id, firebaseId, profile);
}
