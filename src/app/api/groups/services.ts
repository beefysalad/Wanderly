import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { syncUserToDatabaseService } from "../sync/syncService";
import { generateUniqueGroupCode } from "@/lib/utils/groupCode";
import type { DecodedIdToken } from "firebase-admin/auth";

/**
 * Gets or creates a user in the database from Firebase token
 */
async function getOrCreateUser(token: DecodedIdToken) {
  return await syncUserToDatabaseService(token);
}

/**
 * Creates a new group and adds the creator as a member
 */
export async function createGroupService(
  token: DecodedIdToken,
  name: string,
  colorScheme: string = "orange",
  emoji: string | null = null
) {
  const user = await getOrCreateUser(token);

  const code = await generateUniqueGroupCode();

  const group = await prisma.group.create({
    data: {
      name,
      code,
      colorScheme,
      emoji,
      createdById: user.id,
      members: {
        create: {
          userId: user.id,
          role: "admin",
        },
      },
    },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      trips: {
        include: {
          activities: true,
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  logger.info("Group created", { groupId: group.id, code: group.code });
  return group;
}

/**
 * Joins a group by code
 */
export async function joinGroupService(
  token: DecodedIdToken,
  groupCode: string
) {
  const user = await getOrCreateUser(token);

  // Find group by code
  const group = await prisma.group.findUnique({
    where: { code: groupCode },
  });

  if (!group) {
    throw new Error("Group not found");
  }

  // Check if user is already a member
  const existingMember = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId: group.id,
        userId: user.id,
      },
    },
  });

  if (existingMember) {
    throw new Error("User is already a member of this group");
  }

  // Add user as member
  await prisma.groupMember.create({
    data: {
      groupId: group.id,
      userId: user.id,
      role: "member",
    },
  });

  // Fetch the updated group with all relations
  const updatedGroup = await prisma.group.findUnique({
    where: { id: group.id },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      trips: {
        include: {
          activities: true,
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  logger.info("User joined group", {
    userId: user.id,
    groupId: group.id,
    code: groupCode,
  });

  return updatedGroup!;
}

/**
 * Lists all groups the user is a member of
 */
export async function listGroupsService(token: DecodedIdToken) {
  const user = await getOrCreateUser(token);

  const groupMemberships = await prisma.groupMember.findMany({
    where: {
      userId: user.id,
    },
    include: {
      group: {
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          trips: {
            include: {
              activities: true,
              creator: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      group: {
        createdAt: "desc",
      },
    },
  });

  return groupMemberships.map((gm) => gm.group);
}

/**
 * Gets a single group by ID with all relations
 */
export async function getGroupByIdService(
  token: DecodedIdToken,
  groupId: string
) {
  const user = await getOrCreateUser(token);

  // Check if user is a member
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
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      trips: {
        include: {
          activities: true,
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!group) {
    throw new Error("Group not found");
  }

  return group;
}

/**
 * Removes a user from a group (leaves the group)
 */
export async function leaveGroupService(
  token: DecodedIdToken,
  groupId: string
) {
  const user = await getOrCreateUser(token);

  // Verify user is a member of the group
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

  // Check if user is the creator
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { createdById: true },
  });

  if (!group) {
    throw new Error("Group not found");
  }

  if (group.createdById === user.id) {
    throw new Error("Group creator cannot leave the group");
  }

  // Remove the membership
  await prisma.groupMember.delete({
    where: {
      groupId_userId: {
        groupId,
        userId: user.id,
      },
    },
  });

  logger.info("User left group", { userId: user.id, groupId });
}

/**
 * Deletes a group (only creator can delete)
 */
export async function deleteGroupService(
  token: DecodedIdToken,
  groupId: string
) {
  const user = await getOrCreateUser(token);

  // Verify group exists and user is the creator
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { createdById: true },
  });

  if (!group) {
    throw new Error("Group not found");
  }

  if (group.createdById !== user.id) {
    throw new Error("Only the group creator can delete the group");
  }

  // Delete the group (cascade will handle members, trips, expenses, etc.)
  await prisma.group.delete({
    where: { id: groupId },
  });

  logger.info("Group deleted", { groupId, deletedBy: user.id });
}

/**
 * Updates a group (only creator/admin can update)
 */
export async function updateGroupService(
  token: DecodedIdToken,
  groupId: string,
  updates: {
    name?: string;
    colorScheme?: string;
    emoji?: string | null;
  }
) {
  const user = await getOrCreateUser(token);

  // Verify group exists and user is the creator or admin
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        where: { userId: user.id },
      },
    },
  });

  if (!group) {
    throw new Error("Group not found");
  }

  const membership = group.members[0];
  if (!membership) {
    throw new Error("User is not a member of this group");
  }

  // Only creator or admin can update
  const isCreator = group.createdById === user.id;
  const isAdmin = membership.role === "admin";
  if (!isCreator && !isAdmin) {
    throw new Error("Only group creator or admin can update the group");
  }

  // Validate name if provided
  if (updates.name !== undefined) {
    if (!updates.name || typeof updates.name !== "string" || updates.name.trim().length < 5) {
      throw new Error("Group name must be at least 5 characters");
    }
  }

  // Build update data
  const updateData: {
    name?: string;
    colorScheme?: string;
    emoji?: string | null;
  } = {};

  if (updates.name !== undefined) {
    updateData.name = updates.name.trim();
  }
  if (updates.colorScheme !== undefined) {
    updateData.colorScheme = updates.colorScheme;
  }
  if (updates.emoji !== undefined) {
    updateData.emoji = updates.emoji;
  }

  // Update the group
  const updatedGroup = await prisma.group.update({
    where: { id: groupId },
    data: updateData,
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      trips: {
        include: {
          activities: true,
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  logger.info("Group updated", { groupId, updatedBy: user.id, updates });
  return updatedGroup;
}

/**
 * Gets a group by ID for guest access (validates group code)
 */
export async function getGroupByIdForGuestService(
  groupCode: string,
  groupId: string
) {
  // Find group by ID
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      trips: {
        include: {
          activities: true,
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!group) {
    throw new Error("Group not found");
  }

  // Validate group code matches
  if (group.code !== groupCode) {
    throw new Error("Invalid group code");
  }

  logger.info("Guest accessed group", { groupId: group.id, code: groupCode });

  return group;
}
