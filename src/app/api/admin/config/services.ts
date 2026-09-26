import { logger } from "@/lib/logger";
import type { Prisma } from "@prisma/client";
import { listAppConfigs, upsertAppConfig } from "./repository";
import type { UpsertConfigBody } from "./schemas";

export async function listConfigsService() {
  const configs = await listAppConfigs();
  // The retired shared-password row must never be shown (it is plain text).
  return configs.filter((config) => config.key !== "admin_password");
}

export async function upsertConfigService(data: UpsertConfigBody) {
  const config = await upsertAppConfig(data.key, data.value as Prisma.InputJsonValue);

  logger.info("Admin: Updated app config", { key: data.key });

  return config;
}
