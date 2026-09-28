import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const GROUP_DETAIL_INCLUDE = {
  creator: { select: { id: true, name: true, email: true } },
  members: {
    include: {
      user: { select: { id: true, name: true, email: true, imageUrl: true } },
    },
  },
  trips: {
    include: {
      activities: true,
      creator: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" as const },
  },
} satisfies Prisma.GroupInclude;

export type GroupWithDetail = Prisma.GroupGetPayload<{
  include: typeof GROUP_DETAIL_INCLUDE;
}>;

/**
 * Trip shape for the groups LIST endpoint: enough for the Sidebar/Dashboard/Groups/Trips/Profile
 * pages (id, dates, status, location for the "next trip" card) plus an activity count, but not
 * the full activities array — that stays on the single-group detail include above.
 */
export const GROUP_LIST_TRIP_SELECT = {
  id: true,
  groupId: true,
  name: true,
  startDate: true,
  endDate: true,
  location: true,
  status: true,
  createdAt: true,
  _count: { select: { activities: true } },
} satisfies Prisma.TripSelect;

export const GROUP_LIST_INCLUDE = {
  creator: { select: { id: true, name: true, email: true } },
  members: {
    include: {
      user: { select: { id: true, name: true, email: true, imageUrl: true } },
    },
  },
  trips: {
    select: GROUP_LIST_TRIP_SELECT,
    orderBy: { createdAt: "desc" as const },
  },
} satisfies Prisma.GroupInclude;

export type GroupWithListDetail = Prisma.GroupGetPayload<{
  include: typeof GROUP_LIST_INCLUDE;
}>;

export function findGroupById(groupId: string) {
  return prisma.group.findUnique({
    where: { id: groupId },
    include: GROUP_DETAIL_INCLUDE,
  });
}

export function findGroupCodeLookup(code: string) {
  return prisma.group.findUnique({
    where: { code },
    select: { id: true, name: true, code: true },
  });
}

export function findGroupOwnership(groupId: string) {
  return prisma.group.findUnique({
    where: { id: groupId },
    select: { createdById: true, name: true },
  });
}

export function findGroupMembership(groupId: string, userId: string) {
  return prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
}

export function findGroupWithMembership(groupId: string, userId: string) {
  return prisma.group.findUnique({
    where: { id: groupId },
    include: { members: { where: { userId } } },
  });
}

export function listGroupMembersForNotify(groupId: string) {
  return prisma.groupMember.findMany({
    where: { groupId },
    include: { user: { select: { id: true, email: true } } },
  });
}

export function listGroupMembershipsForUser(userId: string) {
  return prisma.groupMember.findMany({
    where: { userId },
    include: { group: { include: GROUP_LIST_INCLUDE } },
    orderBy: { group: { createdAt: "desc" } },
  });
}

export interface CreateGroupRow {
  name: string;
  code: string;
  colorScheme: string;
  emoji: string | null;
  createdById: string;
}

export function createGroupRow(data: CreateGroupRow) {
  return prisma.group.create({
    data: {
      name: data.name,
      code: data.code,
      colorScheme: data.colorScheme,
      emoji: data.emoji,
      createdById: data.createdById,
      members: { create: { userId: data.createdById, role: "admin" } },
    },
    include: GROUP_DETAIL_INCLUDE,
  });
}

export function addGroupMember(groupId: string, userId: string, role: string) {
  return prisma.groupMember.create({ data: { groupId, userId, role } });
}

export function removeGroupMember(groupId: string, userId: string) {
  return prisma.groupMember.delete({
    where: { groupId_userId: { groupId, userId } },
  });
}

export interface UpdateGroupRow {
  name?: string;
  colorScheme?: string;
  emoji?: string | null;
}

export function updateGroupRow(groupId: string, data: UpdateGroupRow) {
  return prisma.group.update({
    where: { id: groupId },
    data,
    include: GROUP_DETAIL_INCLUDE,
  });
}

export function deleteGroupRow(groupId: string) {
  return prisma.group.delete({ where: { id: groupId } });
}
