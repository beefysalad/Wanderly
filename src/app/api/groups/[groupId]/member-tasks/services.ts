import { logger } from "@/lib/logger";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import type { DecodedIdToken } from "firebase-admin/auth";
import type { MemberTaskStatus } from "@prisma/client";
import { syncUserToDatabaseService } from "../../../sync/syncService";
import { findGroupMembership, findGroupOwnership } from "../../repository";
import {
  createMemberTaskRow,
  deleteMemberTaskRow,
  findMemberTaskById,
  listMemberTasksByGroup,
  updateMemberTaskRow,
} from "./repository";
import type { CreateMemberTaskBody, UpdateMemberTaskBody } from "./schemas";

async function getOrCreateUser(token: DecodedIdToken) {
  return syncUserToDatabaseService(token);
}

async function verifyGroupMembership(token: DecodedIdToken, groupId: string) {
  const user = await getOrCreateUser(token);

  const membership = await findGroupMembership(groupId, user.id);
  if (!membership) {
    throw new ForbiddenError("User is not a member of this group");
  }

  const group = await findGroupOwnership(groupId);
  if (!group) {
    throw new NotFoundError("Group not found");
  }

  return { user, group };
}

export async function listMemberTasksService(token: DecodedIdToken, groupId: string) {
  await verifyGroupMembership(token, groupId);
  return listMemberTasksByGroup(groupId);
}

export async function createMemberTaskService(
  token: DecodedIdToken,
  groupId: string,
  data: CreateMemberTaskBody,
) {
  const { user, group } = await verifyGroupMembership(token, groupId);

  const assigneeMembership = await findGroupMembership(groupId, data.assignedToId);
  if (!assigneeMembership) {
    throw new ValidationError("Assignee must be a member of this group");
  }

  const task = await createMemberTaskRow({
    groupId,
    assignedToId: data.assignedToId,
    createdById: user.id,
    title: data.title,
    notes: data.notes ?? null,
    dueDate: data.dueDate ?? null,
    status: (data.status ?? "not_started") as MemberTaskStatus,
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
  updates: UpdateMemberTaskBody,
) {
  await verifyGroupMembership(token, groupId);

  const existingTask = await findMemberTaskById(taskId);
  if (!existingTask || existingTask.groupId !== groupId) {
    throw new NotFoundError("Task not found");
  }

  if (updates.assignedToId) {
    const assigneeMembership = await findGroupMembership(groupId, updates.assignedToId);
    if (!assigneeMembership) {
      throw new ValidationError("Assignee must be a member of this group");
    }
  }

  return updateMemberTaskRow(taskId, {
    ...(updates.assignedToId !== undefined && { assignedToId: updates.assignedToId }),
    ...(updates.title !== undefined && { title: updates.title }),
    ...(updates.notes !== undefined && { notes: updates.notes ?? null }),
    ...(updates.dueDate !== undefined && { dueDate: updates.dueDate ?? null }),
    ...(updates.status !== undefined && { status: updates.status as MemberTaskStatus }),
  });
}

export async function deleteMemberTaskService(
  token: DecodedIdToken,
  groupId: string,
  taskId: string,
) {
  await verifyGroupMembership(token, groupId);

  const existingTask = await findMemberTaskById(taskId);
  if (!existingTask || existingTask.groupId !== groupId) {
    throw new NotFoundError("Task not found");
  }

  await deleteMemberTaskRow(taskId);
}
