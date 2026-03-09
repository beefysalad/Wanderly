import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import type { MemberTaskStatus } from "@prisma/client";
import type { DecodedIdToken } from "firebase-admin/auth";
import { syncUserToDatabaseService } from "../../../sync/syncService";

async function getOrCreateUser(token: DecodedIdToken) {
  return await syncUserToDatabaseService(token);
}

async function verifyGroupMembership(token: DecodedIdToken, groupId: string) {
  const user = await getOrCreateUser(token);

  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: user.id,
      },
    },
  });

  if (!membership) {
    throw new Error("User is not a member of this group");
  }

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { id: true, name: true },
  });

  if (!group) {
    throw new Error("Group not found");
  }

  return { user, group };
}

export async function listMemberTasksService(
  token: DecodedIdToken,
  groupId: string,
) {
  await verifyGroupMembership(token, groupId);

  return await prisma.memberTask.findMany({
    where: { groupId },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
          imageUrl: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export async function createMemberTaskService(
  token: DecodedIdToken,
  groupId: string,
  data: {
    assignedToId: string;
    title: string;
    notes?: string | null;
    dueDate?: Date | null;
    status?: MemberTaskStatus;
  },
) {
  const { user, group } = await verifyGroupMembership(token, groupId);

  const assigneeMembership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: data.assignedToId,
      },
    },
  });

  if (!assigneeMembership) {
    throw new Error("Assignee must be a member of this group");
  }

  const task = await prisma.memberTask.create({
    data: {
      groupId,
      assignedToId: data.assignedToId,
      createdById: user.id,
      title: data.title,
      notes: data.notes || null,
      dueDate: data.dueDate || null,
      status: data.status || "not_started",
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
          imageUrl: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  logger.info("Member task created", {
    taskId: task.id,
    groupId,
    createdById: user.id,
    groupName: group.name,
  });

  return task;
}

export async function updateMemberTaskService(
  token: DecodedIdToken,
  groupId: string,
  taskId: string,
  updates: {
    assignedToId?: string;
    title?: string;
    notes?: string | null;
    dueDate?: Date | null;
    status?: MemberTaskStatus;
  },
) {
  await verifyGroupMembership(token, groupId);

  const existingTask = await prisma.memberTask.findUnique({
    where: { id: taskId },
    select: { id: true, groupId: true },
  });

  if (!existingTask || existingTask.groupId !== groupId) {
    throw new Error("Task not found");
  }

  if (updates.assignedToId) {
    const assigneeMembership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: updates.assignedToId,
        },
      },
    });

    if (!assigneeMembership) {
      throw new Error("Assignee must be a member of this group");
    }
  }

  return await prisma.memberTask.update({
    where: { id: taskId },
    data: {
      ...(updates.assignedToId !== undefined && {
        assignedToId: updates.assignedToId,
      }),
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.notes !== undefined && { notes: updates.notes || null }),
      ...(updates.dueDate !== undefined && { dueDate: updates.dueDate || null }),
      ...(updates.status !== undefined && { status: updates.status }),
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
          imageUrl: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function deleteMemberTaskService(
  token: DecodedIdToken,
  groupId: string,
  taskId: string,
) {
  await verifyGroupMembership(token, groupId);

  const existingTask = await prisma.memberTask.findUnique({
    where: { id: taskId },
    select: { id: true, groupId: true },
  });

  if (!existingTask || existingTask.groupId !== groupId) {
    throw new Error("Task not found");
  }

  await prisma.memberTask.delete({
    where: { id: taskId },
  });
}
