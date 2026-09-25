import prisma from "@/lib/prisma";

export function findUserByFirebaseId(firebaseId: string) {
  return prisma.user.findUnique({ where: { firebaseId } });
}

export interface FirebaseProfile {
  email: string;
  name: string;
  imageUrl: string;
  disabled: boolean;
}

/** Creates the user or refreshes their Firebase-owned fields, matched by email. */
export function upsertUserFromFirebase(firebaseId: string, profile: FirebaseProfile) {
  const { disabled, ...fields } = profile;

  return prisma.user.upsert({
    where: { email: profile.email },
    create: { ...fields, firebaseId },
    update: { ...fields, firebaseId, firebaseDisabled: disabled },
  });
}
