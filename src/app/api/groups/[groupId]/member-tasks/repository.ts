import prisma from "@/lib/prisma";
import type { MemberTaskStatus, Prisma } from "@prisma/client";

const MEMBER_TASK_INCLUDE = {
  assignedTo: { select: { id: true, name: true, email: true, imageUrl: true } },
  createdBy: { select: { id: true, name: true, email: true } },
} satisfies Prisma.MemberTaskInclude;

export function listMemberTasksByGroup(groupId: string) {
  return prisma.memberTask.findMany({
    where: { groupId },
    include: MEMBER_TASK_INCLUDE,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export function findMemberTaskById(taskId: string) {
  return prisma.memberTask.findUnique({
    where: { id: taskId },
    select: { id: true, groupId: true },
  });
}

export interface CreateMemberTaskRow {
  groupId: string;
  assignedToId: string;
  createdById: string;
  title: string;
  notes: string | null;
  dueDate: Date | null;
  status: MemberTaskStatus;
}

export function createMemberTaskRow(data: CreateMemberTaskRow) {
  return prisma.memberTask.create({ data, include: MEMBER_TASK_INCLUDE });
}

export interface UpdateMemberTaskRow {
  assignedToId?: string;
  title?: string;
  notes?: string | null;
  dueDate?: Date | null;
  status?: MemberTaskStatus;
}

export function updateMemberTaskRow(taskId: string, data: UpdateMemberTaskRow) {
  return prisma.memberTask.update({
    where: { id: taskId },
    data,
    include: MEMBER_TASK_INCLUDE,
  });
}

export function deleteMemberTaskRow(taskId: string) {
  return prisma.memberTask.delete({ where: { id: taskId } });
}
