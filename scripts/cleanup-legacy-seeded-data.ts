import prisma from "@/src/lib/prisma";
import { runCleanup } from "@/src/app/api/admin/db/legacyCleanupService";

const execute = process.argv.includes("--execute");

runCleanup(execute)
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
