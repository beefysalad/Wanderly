import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, "../.env") });

const prisma = new PrismaClient();

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error("❌ ADMIN_PASSWORD not found in .env file");
    process.exit(1);
  }

  console.log("🔄 Syncing admin password to database...");

  try {
    const config = await prisma.appConfig.upsert({
      where: { key: "admin_password" },
      update: { value: adminPassword },
      create: { 
        key: "admin_password", 
        value: adminPassword 
      },
    });

    console.log("✅ Admin password successfully synced to database!");
    console.log("Key:", config.key);
    console.log("Updated At:", config.updatedAt);
  } catch (error) {
    console.error("❌ Failed to sync admin password:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
