import { verifyAdminPassword } from "@/lib/admin-auth";
import { UnauthorizedError } from "@/lib/errors";
import type { NextRequest } from "next/server";

/**
 * Rejects the request unless it carries the admin password.
 * NOTE: the shared password itself is a known weak point (see CLAUDE.md) and is replaced in the
 * security pass; this guard only removes the copy-pasted check from every admin route.
 */
export async function assertAdmin(req: NextRequest) {
  const adminPassword = req.headers.get("x-admin-password");
  if (!(await verifyAdminPassword(adminPassword))) {
    throw new UnauthorizedError("Unauthorized");
  }
}
