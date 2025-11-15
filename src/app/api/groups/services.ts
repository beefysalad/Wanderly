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
  name: string
) {
  const user = await getOrCreateUser(token);

  const code = await generateUniqueGroupCode();

  const group = await prisma.group.create({
    data: {
      name,
      code,
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

