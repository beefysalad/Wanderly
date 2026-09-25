import { isAdminEmail } from "@/lib/auth/admin";
import { UnauthorizedError } from "@/lib/errors";
import { userAuth } from "@/lib/firebase-admin";
import type { NextRequest } from "next/server";

async function adminEmailFromToken(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ") || !userAuth) return null;

  try {
    const decoded = await userAuth.verifyIdToken(authHeader.slice("Bearer ".length), true);
    return isAdminEmail(decoded.email, decoded.email_verified)
      ? decoded.email!.toLowerCase()
      : null;
  } catch {
    return null;
  }
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
