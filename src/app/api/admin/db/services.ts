import { logger } from "@/src/lib/logger";
import { fetchCloudinaryUsage, type CloudinaryUsage } from "./cloudinary";
import { countAllEntities, getDatabaseSizeBytes } from "./repository";

/** used / limit as a percentage; 0 when the limit is missing or zero. */
export function toUsageMetric(resource?: { usage?: number; limit?: number }) {
  const used = resource?.usage || 0;
  const limit = resource?.limit || 0;
  return { used, limit, usedPercent: limit > 0 ? (used / limit) * 100 : 0 };
}

export function toCloudinaryStats(usage: CloudinaryUsage | null) {
  if (!usage) return null;

  return {
    plan: usage.plan,
    storage: toUsageMetric(usage.resources),
    bandwidth: toUsageMetric(usage.bandwidth),
    objects: toUsageMetric(usage.objects),
  };
}

export async function getDbStatsService() {
  const stats = await countAllEntities();

  // Size and Cloudinary usage are best-effort extras: failures degrade to 0 / null.
  let dbSize = 0;
  try {
    dbSize = await getDatabaseSizeBytes();
  } catch (e) {
    logger.error("Admin: Failed to get db size", e);
  }

  let cloudinaryUsage: CloudinaryUsage | null = null;
  try {
    cloudinaryUsage = await fetchCloudinaryUsage();
  } catch (e) {
    logger.error("Admin: Failed to get cloudinary usage", e);
  }

  return {
    stats,
    usage: {
      database: { sizeBytes: dbSize },
      cloudinary: toCloudinaryStats(cloudinaryUsage),
    },
  };
}
