import { logger } from "@/src/lib/logger";
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
 * The raw maintenance-mode row value, cached (revalidated by the admin config POST, or after
 * 60s as a self-healing fallback) so every page load doesn't query the database. A failed read
 * throws out of the cached function, and unstable_cache does not store thrown errors, so one
 * timeout is not pinned in the cache for a minute.
 */
const readMaintenanceConfigValue = unstable_cache(
  async (): Promise<unknown> => {
    const config = await findAppConfig("maintenance-mode");
    return config?.value ?? null;
  },
  ["maintenance-config"],
  { tags: [MAINTENANCE_CONFIG_TAG], revalidate: 60 },
);

/**
 * Whether the site is in maintenance mode, read on every request via the root layout. Falls
 * back to the env flag on any failure — a bad read here must never take the whole site down.
 */
export async function getMaintenanceConfigService(): Promise<MaintenanceStatus> {
  const envDefault = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";
  const fallback = { isMaintenanceMode: envDefault, maintenanceEstimate: DEFAULT_ESTIMATE };

  let value: unknown;
  try {
    value = await readMaintenanceConfigValue();
  } catch (err) {
    logger.error("Failed to load maintenance config, falling back to env flag", { error: err });
    return fallback;
  }

  if (value === null) return fallback;

  const parsed = maintenanceConfigValueSchema.safeParse(value);
  if (!parsed.success) {
    logger.error("Invalid maintenance-mode config value, falling back to env flag", {
      error: parsed.error,
    });
    return fallback;
  }

  if (typeof parsed.data === "boolean") {
    return { isMaintenanceMode: parsed.data, maintenanceEstimate: DEFAULT_ESTIMATE };
  }
  return {
    isMaintenanceMode: parsed.data.enabled ?? envDefault,
    maintenanceEstimate: parsed.data.estimate || DEFAULT_ESTIMATE,
  };
}
