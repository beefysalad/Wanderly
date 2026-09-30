import type { AdminUserSummary } from "@/src/shared/types";

export type UserStatus = "online" | "active" | "offline";

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** "online" within the last 15 minutes, "active" within the last day, "offline" otherwise (or never). */
export function getUserStatus(lastLoginAt: string | null, now: Date = new Date()): UserStatus {
  if (!lastLoginAt) return "offline";

  const diff = now.getTime() - new Date(lastLoginAt).getTime();
  if (diff < FIFTEEN_MINUTES_MS) return "online";
  if (diff < ONE_DAY_MS) return "active";
  return "offline";
}

/** Users whose name or email contains `query`, case-insensitively. */
export function filterUsers(users: AdminUserSummary[], query: string): AdminUserSummary[] {
  const q = query.toLowerCase();
  return users.filter((user) => user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q));
}
