import prisma from "@/src/lib/prisma";
import {
  DEMO_GROUP_CODE,
  DEMO_GROUP_NAME,
  DEMO_OWNER_EMAIL,
  DEMO_OWNER_FIREBASE_ID,
  DEMO_TRIP_NAME,
} from "@/src/app/api/groups/demoTrip";

const DAY_MS = 24 * 60 * 60 * 1000;
const TRIP_START_OFFSET_DAYS = 14;

async function main() {
  const existing = await prisma.group.findUnique({
    where: { code: DEMO_GROUP_CODE },
    include: { trips: { include: { _count: { select: { activities: true } } } } },
  });
  const hasActivities = existing?.trips.some((t) => t._count.activities > 0) ?? false;
  const isStale = existing?.trips.some((t) => t.endDate < new Date()) ?? false;
  if (hasActivities && !isStale) {
    console.log(`Demo group already exists (id ${existing!.id}, code ${DEMO_GROUP_CODE}). Nothing to do.`);
    return;
  }
  if (existing) {
    const existingOwner = await prisma.user.findUnique({ where: { email: DEMO_OWNER_EMAIL } });
    if (existing.createdById !== existingOwner?.id) {
      throw new Error(
        `Refusing to delete group ${existing.id} (code ${DEMO_GROUP_CODE}): it was not created by the demo owner account. A real group may have collided with this code.`,
      );
    }
    const reason = isStale ? "has drifted into the past" : "exists but is incomplete (likely a prior failed run)";
    console.log(`Demo group ${existing.id} ${reason} — recreating with fresh dates.`);
    await prisma.group.delete({ where: { id: existing.id } });
  }

  const owner = await prisma.user.upsert({
    where: { email: DEMO_OWNER_EMAIL },
    update: {},
    create: {
      name: "Wanderly",
      email: DEMO_OWNER_EMAIL,
      firebaseId: DEMO_OWNER_FIREBASE_ID,
      hasCompletedOnboarding: true,
    },
  });

  const startDate = new Date(Date.now() + TRIP_START_OFFSET_DAYS * DAY_MS);
  const tripDay = (offset: number) => new Date(startDate.getTime() + offset * DAY_MS);
  const endDate = tripDay(3); // 4 days total

  const group = await prisma.group.create({
    data: {
      name: DEMO_GROUP_NAME,
      code: DEMO_GROUP_CODE,
      colorScheme: "blue",
      emoji: "🍁",
      createdById: owner.id,
      members: { create: [{ userId: owner.id, role: "admin" }] },
    },
  });

  const trip = await prisma.trip.create({
    data: {
      groupId: group.id,
      createdById: owner.id,
      name: DEMO_TRIP_NAME,
      startDate,
      endDate,
      location: "Kyoto, Japan",
      status: "planning",
    },
  });

  const activities = await Promise.all([
    prisma.activity.create({
      data: {
        tripId: trip.id,
        date: tripDay(0),
        title: "Fushimi Inari Shrine",
        startTime: "08:00",
        endTime: "11:00",
        location: "Fushimi Inari Taisha",
        notes: "Thousands of torii gates up the mountain — go early to beat the crowds.",
      },
    }),
    prisma.activity.create({
      data: {
        tripId: trip.id,
        date: tripDay(0),
        title: "Nishiki Market food crawl",
        startTime: "13:00",
        endTime: "15:30",
        location: "Nishiki Market",
        notes: "Street food, local snacks, and souvenir shopping.",
      },
    }),
    prisma.activity.create({
      data: {
        tripId: trip.id,
        date: tripDay(1),
        title: "Arashiyama Bamboo Grove",
        startTime: "09:00",
        endTime: "12:00",
        location: "Arashiyama",
        transportationMode: "train",
        notes: "Bamboo grove, then the Tenryu-ji temple gardens next door.",
      },
    }),
    prisma.activity.create({
      data: {
        tripId: trip.id,
        date: tripDay(2),
        title: "Kinkaku-ji (Golden Pavilion)",
        startTime: "10:00",
        endTime: "12:00",
        location: "Kinkaku-ji",
      },
    }),
  ]);

  await prisma.expense.create({
    data: {
      groupId: group.id,
      tripId: trip.id,
      activityId: activities[1].id,
      tempPaidBy: "Alex",
      amount: 42.5,
      description: "Nishiki Market snacks",
      date: tripDay(0),
      category: "Food",
      splits: {
        create: [{ tempName: "Alex" }, { tempName: "Jordan" }],
      },
    },
  });

  await prisma.expense.create({
    data: {
      groupId: group.id,
      tripId: trip.id,
      activityId: activities[2].id,
      tempPaidBy: "Jordan",
      amount: 18,
      description: "Train tickets to Arashiyama",
      date: tripDay(1),
      category: "Transport",
      splits: {
        create: [{ tempName: "Alex" }, { tempName: "Jordan" }],
      },
    },
  });

  console.log(`Created demo group ${group.id} ("${DEMO_GROUP_NAME}", code ${DEMO_GROUP_CODE}) with trip ${trip.id}.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
