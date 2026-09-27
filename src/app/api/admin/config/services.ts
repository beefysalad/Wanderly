import { logger } from "@/lib/logger";
import type { Prisma } from "@prisma/client";
import { revalidateTag, unstable_cache } from "next/cache";
import { findAppConfig, listAppConfigs, upsertAppConfig } from "./repository";
import { maintenanceConfigValueSchema, type UpsertConfigBody } from "./schemas";

const MAINTENANCE_CONFIG_TAG = "maintenance-config";
const DEFAULT_ESTIMATE = "30-60 Minutes";

export async function listConfigsService() {
  const configs = await listAppConfigs();
  // The retired shared-password row must never be shown (it is plain text).
  return configs.filter((config) => config.key !== "admin_password");
}

export async function upsertConfigService(data: UpsertConfigBody) {
  const config = await upsertAppConfig(data.key, data.value as Prisma.InputJsonValue);

  if (data.key === "maintenance-mode") {
    revalidateTag(MAINTENANCE_CONFIG_TAG);
  }

  logger.info("Admin: Updated app config", { key: data.key });

  return config;
}

export interface MaintenanceStatus {
  isMaintenanceMode: boolean;
  maintenanceEstimate: string;
}

/**
 * Whether the site is in maintenance mode, read on every request via the root layout.
 * Cached (revalidated by the admin config POST, or after 60s as a self-healing fallback)
 * so a Neon cold start doesn't 500 every page, and falls back to the env flag on any
 * failure — a bad read here must never take the whole site down.
 */
export const getMaintenanceConfigService = unstable_cache(
  async (): Promise<MaintenanceStatus> => {
    const envDefault = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";

    try {
      const config = await findAppConfig("maintenance-mode");
      if (!config) {
        return { isMaintenanceMode: envDefault, maintenanceEstimate: DEFAULT_ESTIMATE };
      }

      const parsed = maintenanceConfigValueSchema.safeParse(config.value);
      if (!parsed.success) {
        logger.error("Invalid maintenance-mode config value, falling back to env flag", {
          error: parsed.error,
        });
        return { isMaintenanceMode: envDefault, maintenanceEstimate: DEFAULT_ESTIMATE };
      }

      if (typeof parsed.data === "boolean") {
        return { isMaintenanceMode: parsed.data, maintenanceEstimate: DEFAULT_ESTIMATE };
      }
      return {
        isMaintenanceMode: parsed.data.enabled ?? envDefault,
        maintenanceEstimate: parsed.data.estimate || DEFAULT_ESTIMATE,
      };
    } catch (err) {
      logger.error("Failed to load maintenance config, falling back to env flag", { error: err });
      return { isMaintenanceMode: envDefault, maintenanceEstimate: DEFAULT_ESTIMATE };
    }
  },
  ["maintenance-config"],
  { tags: [MAINTENANCE_CONFIG_TAG], revalidate: 60 },
);
