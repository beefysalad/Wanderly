import prisma from "@/src/lib/prisma";

export function findUserByFirebaseId(firebaseId: string) {
  return prisma.user.findUnique({ where: { firebaseId } });
}

/** Id-only lookup for hot paths (e.g. the trip-access check) that only need the caller's id. */
export function findUserIdByFirebaseId(firebaseId: string) {
  return prisma.user.findUnique({ where: { firebaseId }, select: { id: true } });
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
