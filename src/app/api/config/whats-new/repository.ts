import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const CONFIG_KEY = "whats-new";

export function findWhatsNewConfig() {
  return prisma.appConfig.findUnique({ where: { key: CONFIG_KEY } });
}

export function upsertWhatsNewConfig(value: Prisma.InputJsonValue) {
  return prisma.appConfig.upsert({
    where: { key: CONFIG_KEY },
    update: { value },
    create: { key: CONFIG_KEY, value },
  });
}
