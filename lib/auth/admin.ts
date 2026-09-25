export function parseAdminEmails(raw: string | undefined): Set<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** Admin = a VERIFIED Firebase email that is on the ADMIN_EMAILS allowlist. */
export function isAdminEmail(
  email: string | undefined,
  emailVerified: boolean | undefined,
  allowlist: Set<string> = parseAdminEmails(process.env.ADMIN_EMAILS),
): boolean {
  if (emailVerified !== true || !email) return false;
  return allowlist.has(email.toLowerCase());
}
