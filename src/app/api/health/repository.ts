import prisma from "@/lib/prisma";

/** A trivial round trip to confirm the database connection is alive. */
export async function pingDatabase(): Promise<boolean> {
  await prisma.$queryRaw`SELECT 1`;
  return true;
}
