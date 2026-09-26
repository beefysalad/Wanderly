import { logger } from "@/lib/logger";

/** Structured trail for destructive admin actions (visible in the hosting log stream). */
export function auditAdminAction(
  adminEmail: string,
  action: string,
  target: Record<string, unknown> = {},
) {
  logger.warn("Admin action", { admin: adminEmail, action, ...target });
}
