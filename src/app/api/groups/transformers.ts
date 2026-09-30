import type { Group, Trip, Activity } from "@/src/shared/types";
import type { Prisma } from "@prisma/client";
import type { GROUP_LIST_INCLUDE } from "./repository";

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
            imageUrl: true;
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

type GroupWithListRelations = Prisma.GroupGetPayload<{ include: typeof GROUP_LIST_INCLUDE }>;
type TripListItemRelations = GroupWithListRelations["trips"][number];
type MemberRelations = GroupWithRelations["members"] | GroupWithListRelations["members"];

/** Email-keyed member maps shared by the detail and list group transforms. */
function buildMemberMaps(members: MemberRelations) {
  const memberNames: Record<string, string> = {};
  const memberIds: Record<string, string> = {};
  const memberMetadata: Record<
    string,
    { joinedAt: string; name?: string; imageUrl?: string }
  > = {};

  members.forEach((m) => {
    const email = m.user.email;
    const name = m.user.name || m.user.email.split("@")[0];
    memberNames[email] = name;
    memberIds[email] = m.user.id;
    memberMetadata[email] = {
      joinedAt: m.joinedAt.toISOString(),
      name,
      imageUrl: m.user.imageUrl || undefined,
    };
  });

  return { memberNames, memberIds, memberMetadata };
}

/**
 * Transforms Prisma Group model to TypeScript Group interface
 */
export function transformGroup(prismaGroup: GroupWithRelations): Group {
  const { memberNames, memberIds, memberMetadata } = buildMemberMaps(prismaGroup.members);

  return {
    id: prismaGroup.id,
    name: prismaGroup.name,
    code: prismaGroup.code,
    colorScheme: prismaGroup.colorScheme || undefined,
    emoji: prismaGroup.emoji || undefined,
    createdAt: prismaGroup.createdAt.toISOString(),
    createdBy: prismaGroup.creator.name || prismaGroup.creator.email,
    createdByEmail: prismaGroup.creator.email,
    memberEmails: prismaGroup.members.map((m) => m.user.email),
    memberIds,
    memberNames,
    memberMetadata,
    trips: prismaGroup.trips.map(transformTrip),
  };
}

/**
 * Transforms a Prisma Group for the groups LIST endpoint: same group/member shape as
 * `transformGroup`, but each trip carries an activity count instead of the full activities array.
 */
export function transformGroupListItem(prismaGroup: GroupWithListRelations): Group {
  const { memberNames, memberIds, memberMetadata } = buildMemberMaps(prismaGroup.members);

  return {
    id: prismaGroup.id,
    name: prismaGroup.name,
    code: prismaGroup.code,
    colorScheme: prismaGroup.colorScheme || undefined,
    emoji: prismaGroup.emoji || undefined,
    createdAt: prismaGroup.createdAt.toISOString(),
    createdBy: prismaGroup.creator.name || prismaGroup.creator.email,
    createdByEmail: prismaGroup.creator.email,
    memberEmails: prismaGroup.members.map((m) => m.user.email),
    memberIds,
    memberNames,
    memberMetadata,
    trips: prismaGroup.trips.map(transformTripListItem),
  };
}

/** Shown in place of someone whose account was deleted when their name wasn't kept. */
export const FORMER_MEMBER = "Former member";

/**
 * Transforms Prisma Trip model to TypeScript Trip interface
 */
export function transformTrip(prismaTrip: TripWithRelations): Trip {
  const { creator } = prismaTrip;

  return {
    id: prismaTrip.id,
    groupId: prismaTrip.groupId,
    name: prismaTrip.name,
    startDate: prismaTrip.startDate.toISOString(),
    endDate: prismaTrip.endDate.toISOString(),
    location: prismaTrip.location || undefined,
    status: prismaTrip.status || undefined,
    createdAt: prismaTrip.createdAt.toISOString(),
    createdBy: creator ? creator.name || creator.email : FORMER_MEMBER,
    createdById: creator?.id,
    activities: prismaTrip.activities.map(transformActivity),
  };
}

/**
 * Transforms a slim (list-select) Prisma Trip into the TypeScript Trip interface, using
 * `_count.activities` in place of the full activities array.
 */
export function transformTripListItem(prismaTrip: TripListItemRelations): Trip {
  return {
    id: prismaTrip.id,
    groupId: prismaTrip.groupId,
    name: prismaTrip.name,
    startDate: prismaTrip.startDate.toISOString(),
    endDate: prismaTrip.endDate.toISOString(),
    location: prismaTrip.location || undefined,
    status: prismaTrip.status || undefined,
    createdAt: prismaTrip.createdAt.toISOString(),
    activityCount: prismaTrip._count.activities,
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
    location: prismaActivity.location || undefined,
    notes: prismaActivity.notes || undefined,
    done: prismaActivity.done,
    transportationMode: prismaActivity.transportationMode || undefined,
    pickupTime: prismaActivity.pickupTime || undefined,
    pickupLocation: prismaActivity.pickupLocation || undefined,
    dropoffLocation: prismaActivity.dropoffLocation || undefined,
  };
}
