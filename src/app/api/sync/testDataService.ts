import { logger } from "@/lib/logger";
import { generateUniqueGroupCode } from "@/lib/utils/groupCode";
import { TripStatus } from "@prisma/client";
import {
  ACTIVITIES_BY_DAY,
  BUDGETS,
  DUMMY_USERS,
  EXPENSES,
  GROUP_NAME,
  TRIP_LOCATION,
  TRIP_NAME,
  TRIP_START_OFFSET_DAYS,
  type ActivityRef,
  type MemberRef,
} from "./sampleTripData";
import {
  claimSeedFlag,
  findUserForSeeding,
  releaseSeedFlag,
  runSeedTransaction,
  type SeedOperations,
} from "./seedRepository";

const DAY_MS = 24 * 60 * 60 * 1000;

interface SeedSummary {
  groupId: string;
  tripId: string;
  memberEmails: string[];
  totalActivities: number;
}

/**
 * Creates the sample group, trip, activities, budgets and expenses for one user.
 * Returns undefined when the sample group already exists.
 */
async function seedSampleTrip(
  ops: SeedOperations,
  user: { id: string; email: string; name: string },
): Promise<SeedSummary | undefined> {
  // IMPORTANT: the dummy users are SHARED across all seeded accounts. The first signup creates
  // them and later signups reuse them; each real user still gets their own group and trip.
  const dummyUsers = await Promise.all(
    DUMMY_USERS.map(async (d) => {
      const existing = await ops.findUserByEmail(d.email);
      if (existing) {
        logger.info(`♻️  Reusing existing dummy user: ${d.name}`, { email: d.email });
        return existing;
      }

      logger.info(`✨ Creating new dummy user: ${d.name}`, { email: d.email });
      return ops.createUser(d);
    }),
  );

  const memberUserIds = [user.id, ...dummyUsers.map((u) => u.id)];
  const memberEmails = [user.email, ...dummyUsers.map((u) => u.email)];

  const existingGroup = await ops.findGroupByName(user.id, GROUP_NAME);
  if (existingGroup) {
    logger.info("Test group already exists, skipping seed", {
      userId: user.id,
      groupId: existingGroup.id,
    });
    return undefined;
  }

  const group = await ops.createGroup({
    name: GROUP_NAME,
    code: await generateUniqueGroupCode(),
    colorScheme: "orange",
    emoji: "🇸🇬",
    createdById: user.id,
    memberUserIds,
    adminUserId: user.id,
  });

  const startDate = new Date();
  startDate.setDate(startDate.getDate() + TRIP_START_OFFSET_DAYS);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 4); // 5 days total

  const trip = await ops.createTrip({
    groupId: group.id,
    createdById: user.id,
    name: TRIP_NAME,
    startDate,
    endDate,
    location: TRIP_LOCATION,
    status: TripStatus.planning,
  });

  const tripDay = (dayOffset: number) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + dayOffset);
    return date;
  };

  // Activities are created one day at a time, in parallel within the day.
  const activityIds: string[][] = [];
  for (const [dayOffset, activities] of ACTIVITIES_BY_DAY.entries()) {
    const created = await Promise.all(
      activities.map((activity) =>
        ops.createActivity({ tripId: trip.id, date: tripDay(dayOffset), ...activity }),
      ),
    );
    activityIds.push(created.map((a) => a.id));
  }

  const activityIdOf = (ref?: ActivityRef) => (ref ? activityIds[ref[0]][ref[1]] : undefined);
  const memberIdOf = (ref: MemberRef) => (ref === "self" ? user.id : dummyUsers[ref].id);

  await ops.createBudgets(
    BUDGETS.map(({ activity, ...budget }) => ({
      tripId: trip.id,
      ...(activity && { activityId: activityIdOf(activity) }),
      ...budget,
    })),
  );

  for (const expense of EXPENSES) {
    const { activity, paidBy, when, splitWith, bankDetails, ...fields } = expense;

    await ops.createExpense({
      groupId: group.id,
      tripId: trip.id,
      ...(activity && { activityId: activityIdOf(activity) }),
      paidById: memberIdOf(paidBy),
      createdById: user.id,
      ...fields,
      date: "daysAgo" in when ? new Date(Date.now() - when.daysAgo * DAY_MS) : tripDay(when.tripDay),
      ...(bankDetails && { ...bankDetails, accountName: user.name }),
      splitUserIds: splitWith === "everyone" ? memberUserIds : splitWith.map(memberIdOf),
    });
  }

  return {
    groupId: group.id,
    tripId: trip.id,
    memberEmails,
    totalActivities: activityIds.flat().length,
  };
}

/**
 * Seeds comprehensive sample data for a newly registered user: a realistic 5-day Singapore trip
 * with detailed activities, expenses and budgets. Safe to call repeatedly: only the first call
 * for a user does anything.
 */
export async function seedTestData(userId: string) {
  try {
    logger.info("🌱 Seeding ultra-enhanced test data for new user", { userId });

    if (!(await claimSeedFlag(userId))) {
      logger.info("User already seeded (or not found) - blocked by atomic lock", { userId });
      return;
    }

    const user = await findUserForSeeding(userId);
    if (!user) {
      logger.warn(
        "User found during update but not found during fetch (simultaneous delete?)",
        { userId },
      );
      return;
    }

    const summary = await runSeedTransaction((ops) => seedSampleTrip(ops, user));

    if (summary) {
      logger.info("✅ Ultra-Enhanced test data seeded successfully", {
        userId,
        groupId: summary.groupId,
        tripId: summary.tripId,
        members: summary.memberEmails,
        totalActivities: summary.totalActivities,
        daysOfActivities: 5,
      });
    }
  } catch (error) {
    logger.error("❌ Failed to seed test data", { userId, error });

    // Let the user be seeded again on their next sync.
    try {
      await releaseSeedFlag(userId);
    } catch (rollbackError) {
      logger.error("Failed to rollback hasSeededTestData flag", { userId, rollbackError });
    }

    throw error; // Re-throw to let caller handle
  }
}
