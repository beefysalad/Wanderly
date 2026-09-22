import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Setting up reproduction data...");

  // 1. Create a User
  const user = await prisma.user.create({
    data: {
      name: "Repro User",
      email: "repro_" + Date.now() + "@example.com",
      firebaseId: "repro_" + Date.now(),
    },
  });
  console.log("Created User:", user.id);

  // 2. Create a Group owned by User
  const group = await prisma.group.create({
    data: {
      name: "Repro Group",
      code: "REPRO_" + Date.now(),
      createdById: user.id, // User owns group -> Cascade delete
      members: {
        create: { userId: user.id },
      },
    },
  });
  console.log("Created Group:", group.id);

  // 3. Create a Trip (required for expense)
  const trip = await prisma.trip.create({
    data: {
      name: "Repro Trip",
      groupId: group.id,
      createdById: user.id,
      startDate: new Date(),
      endDate: new Date(),
    },
  });

  // 4. Create an Expense paid by User
  const expense = await prisma.expense.create({
    data: {
      amount: 100,
      description: "Repro Expense",
      date: new Date(),
      groupId: group.id,
      tripId: trip.id,
      paidById: user.id, // User pays -> SetNull on delete
      createdById: user.id,
    },
  });
  console.log("Created Expense:", expense.id);

  console.log("Attempting to delete user...");
  try {
    await prisma.user.delete({
      where: { id: user.id },
    });
    console.log("SUCCESS: User deleted without error.");
  } catch (e) {
    console.error("FAILURE: User deletion failed.");
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
