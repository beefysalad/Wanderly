import { logger } from "@/lib/logger";
import type { Prisma } from "@prisma/client";
import { listAppConfigs, upsertAppConfig } from "./repository";
import type { UpsertConfigBody } from "./schemas";

export function listConfigsService() {
  return listAppConfigs();
}

export async function upsertConfigService(data: UpsertConfigBody) {
  const config = await upsertAppConfig(data.key, data.value as Prisma.InputJsonValue);

  logger.info("Admin: Updated app config", { key: data.key });

  return config;
}
