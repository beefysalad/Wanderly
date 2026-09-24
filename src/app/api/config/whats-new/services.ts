import { logger } from "@/lib/logger";
import { CURRENT_WHATS_NEW_VERSION, WHATS_NEW_FEATURES } from "@/src/app/config/whats-new";
import { findWhatsNewConfig, upsertWhatsNewConfig } from "./repository";
import type { WhatsNewConfigBody } from "./schemas";

/** The admin-edited config if one has been saved, otherwise the built-in defaults. */
export async function getWhatsNewConfigService() {
  const config = await findWhatsNewConfig();

  if (!config) {
    return { version: CURRENT_WHATS_NEW_VERSION, features: WHATS_NEW_FEATURES };
  }

  return config.value;
}

export async function updateWhatsNewConfigService(data: WhatsNewConfigBody) {
  const config = await upsertWhatsNewConfig({ version: data.version, features: data.features });

  logger.info("Whats-new configuration updated by admin");

  return config;
}
