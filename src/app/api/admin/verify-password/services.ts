import { verifyAdminPassword } from "@/lib/admin-auth";
import { UnauthorizedError } from "@/lib/errors";
import { logger } from "@/lib/logger";

export async function verifyAdminPasswordService(password: string | null | undefined, userAgent?: string | null) {
  const isValid = await verifyAdminPassword(password ?? null);

  if (!isValid) {
    logger.warn("Admin: Failed password verification attempt", {
      hasPassword: !!password,
      ua: userAgent,
    });
    throw new UnauthorizedError("Unauthorized");
  }
}
