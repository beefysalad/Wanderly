import prisma from "@/src/lib/prisma";

export function findTripWithActivities(tripId: string) {
  return prisma.trip.findUnique({
    where: { id: tripId },
    include: { activities: { orderBy: { date: "asc" } } },
  });
}
