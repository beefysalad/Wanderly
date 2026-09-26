"use client";

import { useSocketNotifications } from "@/src/hooks/useSocketNotifications";

/** Keeps the unread count and the notification dropdown live while any shell page is open. */
export function ShellEffects() {
  useSocketNotifications();
  return null;
}
