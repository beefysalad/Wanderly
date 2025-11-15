import type { Group, Trip, Activity } from "@/src/shared/types";
import type { Prisma } from "@prisma/client";

type GroupWithRelations = Prisma.GroupGetPayload<{
  include: {
    creator: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    members: {
      include: {
        user: {
          select: {
            id: true;
            name: true;
            email: true;
          };
        };
      };
    };
    trips: {
      include: {
        activities: true;
      };
    };
  };
}>;

/**
 * Transforms Prisma Group model to TypeScript Group interface
 */
export function transformGroup(prismaGroup: GroupWithRelations): Group {
  return {
    id: prismaGroup.id,
    name: prismaGroup.name,
    code: prismaGroup.code,
    createdAt: prismaGroup.createdAt.toISOString(),
    createdBy: prismaGroup.creator.name || prismaGroup.creator.email,
    memberEmails: prismaGroup.members.map((m) => m.user.email),
    trips: prismaGroup.trips.map(transformTrip),
  };
}

/**
 * Transforms Prisma Trip model to TypeScript Trip interface
 */
export function transformTrip(
  prismaTrip: Prisma.TripGetPayload<{
    include: {
      activities: true;
    };
  }>
): Trip {
  return {
    id: prismaTrip.id,
    groupId: prismaTrip.groupId,
    name: prismaTrip.name,
    startDate: prismaTrip.startDate.toISOString(),
    endDate: prismaTrip.endDate.toISOString(),
    location: prismaTrip.location || undefined,
    status: prismaTrip.status || undefined,
    createdAt: prismaTrip.createdAt.toISOString(),
    activities: prismaTrip.activities.map(transformActivity),
  };
}

/**
 * Transforms Prisma Activity model to TypeScript Activity interface
 */
export function transformActivity(
  prismaActivity: Prisma.ActivityGetPayload<Record<string, never>>
): Activity {
  return {
    id: prismaActivity.id,
    date: prismaActivity.date.toISOString(),
    title: prismaActivity.title,
    startTime: prismaActivity.startTime || undefined,
    endTime: prismaActivity.endTime || undefined,
    notes: prismaActivity.notes || undefined,
    done: prismaActivity.done,
  };
}
