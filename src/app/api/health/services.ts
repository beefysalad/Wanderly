import { logger } from "@/lib/logger";
import packageJson from "@/package.json";
import { pingDatabase } from "./repository";

export interface HealthStatus {
  status: "ok" | "degraded";
  version: string;
  database: "up" | "down";
}

export async function getHealthService(): Promise<HealthStatus> {
  try {
    await pingDatabase();
    return { status: "ok", version: packageJson.version, database: "up" };
  } catch (err) {
    logger.error("Health check: database ping failed", { error: err });
    return { status: "degraded", version: packageJson.version, database: "down" };
  }
}
