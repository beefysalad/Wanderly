import prisma from "@/lib/prisma";

export function findTripAccessInfo(tripId: string) {
  return prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true, groupId: true, name: true },
  });
}

export function findUserIdByEmail(email: string) {
  return prisma.user.findUnique({ where: { email }, select: { id: true } });
}
