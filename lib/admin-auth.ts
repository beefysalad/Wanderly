import prisma from "@/lib/prisma";

export async function verifyAdminPassword(password: string | null): Promise<boolean> {
  if (!password) return false;

  try {
    // 1. Check DB first
    const dbConfig = await prisma.appConfig.findUnique({
      where: { key: "admin_password" },
    });

    if (dbConfig && typeof dbConfig.value === "string") {
      return password === dbConfig.value;
    }

    // 2. Fallback to Env
    return password === process.env.ADMIN_PASSWORD;
  } catch (error) {
    console.error("Auth helper error:", error);
    // Fallback to env on DB error just in case
    return password === process.env.ADMIN_PASSWORD;
  }
}
