import prisma from "@/lib/prisma";

export function findTripAccessInfo(tripId: string) {
  return prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true, groupId: true, name: true },
  });
}

export function findTripWithGroupCode(tripId: string) {
  return prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true, groupId: true, group: { select: { code: true } } },
  });
}
