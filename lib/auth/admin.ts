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

/** Firebase uids are unforgeable, so an ADMIN_UIDS entry needs no email verification. */
export function isAdminUid(
  uid: string | undefined,
  allowlist: Set<string> = new Set(
    (process.env.ADMIN_UIDS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  ),
): boolean {
  return !!uid && allowlist.has(uid);
}
