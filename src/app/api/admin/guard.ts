import { isAdminEmail } from "@/lib/auth/admin";
import { UnauthorizedError } from "@/lib/errors";
import { userAuth } from "@/lib/firebase-admin";
import { logger } from "@/lib/logger";
import type { NextRequest } from "next/server";

async function adminEmailFromToken(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ") || !userAuth) {
    logger.warn("Admin check failed", { reason: "no-bearer-token-or-firebase-admin" });
    return null;
  }

  let decoded;
  try {
    decoded = await userAuth.verifyIdToken(authHeader.slice("Bearer ".length), true);
  } catch (error) {
    logger.warn("Admin check failed", { reason: "token-invalid", error });
    return null;
  }

  if (!isAdminEmail(decoded.email, decoded.email_verified)) {
    // The reason is logged for the operator only; the client just sees "not authorised".
    logger.warn("Admin check failed", {
      reason: decoded.email_verified === true ? "email-not-on-ADMIN_EMAILS" : "email-not-verified",
      email: decoded.email,
    });
    return null;
  }

  return decoded.email!.toLowerCase();
}

/**
 * Rejects the request unless it comes from an admin: a verified Firebase account whose email is
 * on the ADMIN_EMAILS allowlist. Returns the admin's email for audit logging.
 */
export async function assertAdmin(req: NextRequest): Promise<{ adminEmail: string }> {
  const adminEmail = await adminEmailFromToken(req);
  if (!adminEmail) {
    throw new UnauthorizedError("Unauthorized");
  }
  return { adminEmail };
}
