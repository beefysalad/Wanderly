import prisma from "@/src/lib/prisma";
import { deleteUserKeepingSharedData, findUserForDeletion } from "@/src/app/api/admin/users/repository";

const LEGACY_DUMMY_EMAILS = [
  "eleven.dummy@example.com",
  "mike.dummy@example.com",
  "steve.dummy@example.com",
];

interface CleanupResult {
  groups: number;
  trips: number;
  dummyUsers: number;
  executed: boolean;
}

export async function runCleanup(execute: boolean): Promise<CleanupResult> {
  const groups = await prisma.group.findMany({
    where: { name: { contains: "(sample)" } },
    select: { id: true, name: true },
  });
  const trips = await prisma.trip.findMany({
    where: { name: { contains: "(sample)" } },
    select: { id: true, name: true },
  });
  const dummyUsers = await prisma.user.findMany({
    where: { email: { in: LEGACY_DUMMY_EMAILS } },
    select: { id: true, email: true, name: true },
  });

  console.log(
    `Found ${groups.length} sample group(s), ${trips.length} orphaned sample trip(s), ${dummyUsers.length} legacy dummy user(s).`,
  );

  if (!execute) {
    console.log("Dry run only — pass --execute to actually delete. Nothing was changed.");
    return { groups: groups.length, trips: trips.length, dummyUsers: dummyUsers.length, executed: false };
  }

  if (groups.length > 0) {
    await prisma.group.deleteMany({ where: { id: { in: groups.map((g) => g.id) } } });
  }
  if (trips.length > 0) {
    await prisma.trip.deleteMany({ where: { id: { in: trips.map((t) => t.id) } } });
  }

  for (const dummyUser of dummyUsers) {
    const plan = await findUserForDeletion(dummyUser.id);
    if (plan && plan.createdGroups.length > 0) {
      throw new Error(
        `Refusing to delete ${dummyUser.email}: it owns a group (${plan.createdGroups[0].id}), which the old seeding logic should never have allowed.`,
      );
    }
    await deleteUserKeepingSharedData({
      userId: dummyUser.id,
      displayName: dummyUser.name,
      groupTransfers: [],
      groupIdsToDelete: [],
    });
  }

  console.log(`Deleted ${groups.length} group(s), ${trips.length} trip(s), ${dummyUsers.length} dummy user(s).`);
  return { groups: groups.length, trips: trips.length, dummyUsers: dummyUsers.length, executed: true };
}
