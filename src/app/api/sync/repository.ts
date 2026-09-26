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

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export function createUserFromFirebase(firebaseId: string, profile: FirebaseProfile) {
  const { disabled, ...fields } = profile;
  return prisma.user.create({ data: { ...fields, firebaseId, firebaseDisabled: disabled } });
}

/** Refreshes the Firebase-owned fields of a user row and sets the Firebase account it belongs to. */
export function updateUserFromFirebase(userId: string, firebaseId: string, profile: FirebaseProfile) {
  const { disabled, ...fields } = profile;
  return prisma.user.update({
    where: { id: userId },
    data: { ...fields, firebaseId, firebaseDisabled: disabled },
  });
}
