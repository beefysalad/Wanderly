import { logger } from "@/lib/logger";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import type { DecodedIdToken } from "firebase-admin/auth";
import { NotificationType } from "@prisma/client";
import { syncUserToDatabaseService } from "../sync/syncService";
import { generateUniqueGroupCode } from "@/lib/utils/groupCode";
import { createNotificationService } from "../notifications/services";
import {
  addGroupMember,
  createGroupRow,
  deleteGroupRow,
  findGroupById,
  findGroupCodeLookup,
  findGroupMembership,
  findGroupOwnership,
  findGroupWithMembership,
  listGroupMembersForNotify,
  listGroupMembershipsForUser,
  removeGroupMember,
  updateGroupRow,
} from "./repository";
import type { CreateGroupBody, UpdateGroupBody } from "./schemas";

async function getOrCreateUser(token: DecodedIdToken) {
  return syncUserToDatabaseService(token);
}

export async function createGroupService(token: DecodedIdToken, input: CreateGroupBody) {
  const user = await getOrCreateUser(token);
  const code = await generateUniqueGroupCode();

  const group = await createGroupRow({
    name: input.name,
    code,
    colorScheme: input.colorScheme,
    emoji: input.emoji,
    createdById: user.id,
  });

  const { emitGroupUpdated } = await import("@/lib/socket-events");
  emitGroupUpdated(group.id, group).catch((err) => {
    logger.error("Failed to emit group created event", { error: err });
  });

  logger.info("Group created", { groupId: group.id, code: group.code });
  return group;
}

export async function joinGroupService(token: DecodedIdToken, groupCode: string) {
  const user = await getOrCreateUser(token);

  const group = await findGroupCodeLookup(groupCode);
  if (!group) {
    throw new NotFoundError("Group not found");
  }

  const existingMembership = await findGroupMembership(group.id, user.id);
  if (existingMembership) {
    throw new ValidationError("User is already a member of this group");
  }

  await addGroupMember(group.id, user.id, "member");

  const updatedGroup = await findGroupById(group.id);

  const allMembers = await listGroupMembersForNotify(group.id);
  const notificationPromises = allMembers
    .filter((member) => member.userId !== user.id)
    .map((member) =>
      createNotificationService(member.userId, {
        type: NotificationType.group_join,
        title: "New Member Joined",
        message: `${user.name || user.email} joined ${group.name}`,
        relatedGroupId: group.id,
      }).catch((err) => {
        logger.error("Failed to create notification", { userId: member.userId, error: err });
      }),
    );
  await Promise.all(notificationPromises);

  if (updatedGroup) {
    const { emitGroupUpdated } = await import("@/lib/socket-events");
    emitGroupUpdated(group.id, updatedGroup).catch((err) => {
      logger.error("Failed to emit group updated event on join", { error: err });
    });
  }

  logger.info("User joined group", { userId: user.id, groupId: group.id, code: groupCode });

  return updatedGroup!;
}

export async function listGroupsService(token: DecodedIdToken) {
  const user = await getOrCreateUser(token);
  const memberships = await listGroupMembershipsForUser(user.id);
  return memberships.map((m) => m.group);
}

export async function getGroupByIdService(token: DecodedIdToken, groupId: string) {
  const user = await getOrCreateUser(token);

  const membership = await findGroupMembership(groupId, user.id);
  if (!membership) {
    throw new ForbiddenError("User is not a member of this group");
  }

  const group = await findGroupById(groupId);
  if (!group) {
    throw new NotFoundError("Group not found");
  }

  return group;
}

export async function leaveGroupService(token: DecodedIdToken, groupId: string) {
  const user = await getOrCreateUser(token);

  const membership = await findGroupMembership(groupId, user.id);
  if (!membership) {
    throw new ForbiddenError("User is not a member of this group");
  }

  const ownership = await findGroupOwnership(groupId);
  if (!ownership) {
    throw new NotFoundError("Group not found");
  }
  if (ownership.createdById === user.id) {
    throw new ValidationError("Group creator cannot leave the group");
  }

  const allMembers = await listGroupMembersForNotify(groupId);

  await removeGroupMember(groupId, user.id);

  const notificationPromises = allMembers
    .filter((member) => member.userId !== user.id)
    .map((member) =>
      createNotificationService(member.userId, {
        type: NotificationType.group_leave,
        title: "Member Left Group",
        message: `${user.name || user.email} left ${ownership.name}`,
        relatedGroupId: groupId,
      }).catch((err) => {
        logger.error("Failed to create notification", { userId: member.userId, error: err });
      }),
    );
  await Promise.all(notificationPromises);

  const updatedGroup = await findGroupById(groupId);
  if (updatedGroup) {
    const { emitGroupUpdated } = await import("@/lib/socket-events");
    emitGroupUpdated(groupId, updatedGroup).catch((err) => {
      logger.error("Failed to emit group updated event on leave", { error: err });
    });
  }

  logger.info("User left group", { userId: user.id, groupId });
}

export async function deleteGroupService(token: DecodedIdToken, groupId: string) {
  const user = await getOrCreateUser(token);

  const ownership = await findGroupOwnership(groupId);
  if (!ownership) {
    throw new NotFoundError("Group not found");
  }
  if (ownership.createdById !== user.id) {
    throw new ForbiddenError("Only the group creator can delete the group");
  }

  await deleteGroupRow(groupId);

  const { emitGroupDeleted } = await import("@/lib/socket-events");
  emitGroupDeleted(groupId).catch((err) => {
    logger.error("Failed to emit group deleted event", { error: err });
  });

  logger.info("Group deleted", { groupId, deletedBy: user.id });
}

export async function updateGroupService(
  token: DecodedIdToken,
  groupId: string,
  updates: UpdateGroupBody,
) {
  const user = await getOrCreateUser(token);

  const group = await findGroupWithMembership(groupId, user.id);
  if (!group) {
    throw new NotFoundError("Group not found");
  }

  const membership = group.members[0];
  if (!membership) {
    throw new ForbiddenError("User is not a member of this group");
  }

  const isCreator = group.createdById === user.id;
  const isAdmin = membership.role === "admin";
  if (!isCreator && !isAdmin) {
    throw new ForbiddenError("Only group creator or admin can update the group");
  }

  const updatedGroup = await updateGroupRow(groupId, updates);

  const { emitGroupUpdated } = await import("@/lib/socket-events");
  emitGroupUpdated(groupId, updatedGroup).catch((err) => {
    logger.error("Failed to emit group updated event", { error: err });
  });

  logger.info("Group updated", { groupId, updatedBy: user.id, updates });
  return updatedGroup;
}

export async function getGroupByIdForGuestService(guestGroupId: string, groupId: string) {
  if (guestGroupId !== groupId) {
    throw new ForbiddenError("Invalid guest access");
  }

  const group = await findGroupById(groupId);
  if (!group) {
    throw new NotFoundError("Group not found");
  }

  logger.info("Guest accessed group", { groupId: group.id });
  return group;
}

export async function validateGroupCodeService(code: string) {
  const group = await findGroupCodeLookup(code);
  if (!group) {
    throw new NotFoundError("Group not found");
  }

  logger.info("Group code validated", { groupId: group.id });
  return group;
}
