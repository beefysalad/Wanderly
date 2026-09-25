import prisma from "@/lib/prisma";

export interface ProfileMetadataUpdate {
  bio?: string;
  travelStyle?: string;
}

export function updateUserMetadataByFirebaseId(
  firebaseId: string,
  data: ProfileMetadataUpdate,
) {
  return prisma.user.update({
    where: { firebaseId },
    data,
  });
}
