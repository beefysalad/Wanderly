import type { Notification } from "@/src/shared/types";

export type NotificationKind = "pay" | "ok" | "exp" | "join" | "act" | "trip";

/** Groups the fourteen notification types into the six the UI colours and icons differently. */
export function notificationKind(type: Notification["type"]): NotificationKind {
  if (type === "payment_confirmed") return "ok";
  if (type === "payment" || type === "payment_rejected") return "pay";
  if (type.startsWith("expense_")) return "exp";
  if (type.startsWith("group_")) return "join";
  if (type.startsWith("activity_")) return "act";
  return "trip";
}

type LinkFields = Pick<
  Notification,
  "type" | "relatedGroupId" | "relatedTripId" | "relatedExpenseId" | "relatedActivityId"
>;

/** The page a notification is about, or null when it doesn't point anywhere. Deleted things link one level up. */
export function notificationHref(n: LinkFields): string | null {
  const group = n.relatedGroupId;
  if (!group) return null;

  const trip = n.relatedTripId ? `/group/${group}/trip/${n.relatedTripId}` : `/group/${group}`;
  const kind = notificationKind(n.type);

  if (kind === "join") return `/group/${group}/members`;
  if (n.type === "trip_deleted") return `/group/${group}`;
  if ((kind === "pay" || kind === "ok" || kind === "exp") && n.relatedExpenseId && n.type !== "expense_deleted") {
    return `/group/${group}/expenses/${n.relatedExpenseId}`;
  }
  if (kind === "act" && n.relatedActivityId && n.relatedTripId && n.type !== "activity_deleted") {
    return `/group/${group}/trip/${n.relatedTripId}/activities/${n.relatedActivityId}`;
  }
  return trip;
}

/** "Just now", "12m ago", "3h ago", "2d ago". */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const seconds = Math.floor((now.getTime() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
