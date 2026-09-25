import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export function listAppConfigs() {
  return prisma.appConfig.findMany({ orderBy: { key: "asc" } });
}

export function upsertAppConfig(key: string, value: Prisma.InputJsonValue) {
  return prisma.appConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}
