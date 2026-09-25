import type { DecodedIdToken } from "firebase-admin/auth";
import { userAuth } from "@/lib/firebase-admin";
import { NotFoundError, UnauthorizedError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { syncUserToDatabaseService } from "../sync/syncService";
import { updateUserMetadataByFirebaseId } from "./repository";
import type { UpdatePasswordBody, UpdateProfileBody } from "./schemas";

export type UpdateProfileInput = UpdateProfileBody;
export type UpdatePasswordInput = UpdatePasswordBody;

export async function getProfileService(decodedToken: DecodedIdToken) {
  return syncUserToDatabaseService(decodedToken, false);
}

export async function updateProfileService(
  decodedToken: DecodedIdToken,
  input: UpdateProfileInput,
) {
  const { name, photoURL, bio, travelStyle } = input;

  if (!userAuth) {
    throw new Error("Firebase admin not initialized");
  }

  const uid = decodedToken.uid;

  if (name !== undefined || photoURL !== undefined) {
    const firebaseUpdate: { displayName?: string; photoURL?: string } = {};
    if (name !== undefined) firebaseUpdate.displayName = name;
    if (photoURL !== undefined) firebaseUpdate.photoURL = photoURL;

    await userAuth.updateUser(uid, firebaseUpdate);
    logger.info("Firebase Auth profile updated", {
      uid,
      updates: Object.keys(firebaseUpdate),
    });
  }

  if (bio !== undefined || travelStyle !== undefined) {
    await updateUserMetadataByFirebaseId(uid, {
      ...(bio !== undefined && { bio }),
      ...(travelStyle !== undefined && { travelStyle }),
    });
    logger.info("Prisma profile metadata updated", {
      uid,
      hasBio: bio !== undefined,
      hasTravelStyle: travelStyle !== undefined,
    });
  }

  return syncUserToDatabaseService(decodedToken, true);
}

export async function updatePasswordService(
  decodedToken: DecodedIdToken,
  input: UpdatePasswordInput,
) {
  const { currentPassword, newPassword } = input;
  const uid = decodedToken.uid;
  const email = decodedToken.email;

  if (!email) {
    throw new ValidationError("User email not found");
  }

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    logger.error("Firebase API Key missing in environment");
    throw new Error("Configuration missing");
  }

  const verifyResponse = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: currentPassword,
        returnSecureToken: true,
      }),
    },
  );

  if (!verifyResponse.ok) {
    const errorData = await verifyResponse.json().catch(() => ({}));
    const firebaseError = errorData?.error?.message;

    if (
      firebaseError === "INVALID_PASSWORD" ||
      firebaseError === "INVALID_LOGIN_CREDENTIALS"
    ) {
      throw new UnauthorizedError("Incorrect current password");
    }

    logger.error("Firebase verification failed", errorData);
    throw new UnauthorizedError("Failed to verify current password");
  }

  if (!userAuth) {
    throw new Error("Firebase Admin not initialized");
  }

  const firebaseUser = await userAuth.getUser(uid);
  if (!firebaseUser) {
    throw new NotFoundError("User not found");
  }

  await userAuth.updateUser(uid, { password: newPassword });
  logger.info("Password updated successfully", { uid });
}
