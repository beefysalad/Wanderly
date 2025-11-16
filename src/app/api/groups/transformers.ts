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
        creator: {
          select: {
            id: true;
            name: true;
            email: true;
          };
        };
      };
    };
  };
}>;

type TripWithRelations =
  | GroupWithRelations["trips"][number]
  | Prisma.TripGetPayload<{
      include: {
        activities: true;
        creator: {
          select: {
            id: true;
            name: true;
            email: true;
          };
        };
      };
    }>;

/**
 * Transforms Prisma Group model to TypeScript Group interface
 */
export function transformGroup(prismaGroup: GroupWithRelations): Group {
  // Create email -> name mapping
  const memberNames: Record<string, string> = {};
  prismaGroup.members.forEach((m) => {
    memberNames[m.user.email] = m.user.name || m.user.email.split("@")[0];
  });

  return {
    id: prismaGroup.id,
    name: prismaGroup.name,
    code: prismaGroup.code,
    createdAt: prismaGroup.createdAt.toISOString(),
    createdBy: prismaGroup.creator.name || prismaGroup.creator.email,
    createdByEmail: prismaGroup.creator.email,
    memberEmails: prismaGroup.members.map((m) => m.user.email),
    memberNames,
    trips: prismaGroup.trips.map(transformTrip),
  };
}

/**
 * Transforms Prisma Trip model to TypeScript Trip interface
 */
export function transformTrip(prismaTrip: TripWithRelations): Trip {
  let createdBy: string | undefined = undefined;
  if (prismaTrip.creator) {
    const creator = prismaTrip.creator as {
      id: string;
      name: string;
      email: string;
    };
    createdBy = creator.name || creator.email;
  }

  return {
    id: prismaTrip.id,
    groupId: prismaTrip.groupId,
    name: prismaTrip.name,
    startDate: prismaTrip.startDate.toISOString(),
    endDate: prismaTrip.endDate.toISOString(),
    location: prismaTrip.location || undefined,
    status: prismaTrip.status || undefined,
    createdAt: prismaTrip.createdAt.toISOString(),
    createdBy,
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
    transportationMode: prismaActivity.transportationMode || undefined,
    pickupTime: prismaActivity.pickupTime || undefined,
    pickupLocation: prismaActivity.pickupLocation || undefined,
    dropoffLocation: prismaActivity.dropoffLocation || undefined,
  };
}
