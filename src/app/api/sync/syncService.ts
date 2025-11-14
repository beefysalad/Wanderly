import { userAuth } from "@/lib/firebase-admin";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { DecodedIdToken } from "firebase-admin/auth";

export async function syncUserToDatabaseService(token: DecodedIdToken) {
  logger.info("🔍 Starting user sync");
  logger.info("✅ Token verified, uid:", token.uid);

  if (!userAuth) {
    throw new Error("Firebase admin not initialized");
  }

  const firebaseUser = await userAuth.getUser(token.uid);
  logger.info("✅ User record fetched:");
  const firebaseUserData = {
    email: firebaseUser.email ?? "",
    name: firebaseUser.displayName ?? "",
    imageUrl: firebaseUser.photoURL ?? "",
  };

  logger.info("👑 Syncing to User table...");
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
  logger.info("✅ Admin sync result:");
  return result;
}
