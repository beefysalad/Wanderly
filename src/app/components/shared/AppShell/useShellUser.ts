"use client";

import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { useCurrentUserDB } from "@/src/hooks/useProfile";

/** Who the sidebar and top bar show: the database profile when it has loaded, Firebase until then. */
export function useShellUser() {
  const { user } = useCurrentUser();
  const { data: dbUser } = useCurrentUserDB();

  const email: string = dbUser?.email ?? user?.email ?? "";
  const name: string = dbUser?.name || user?.displayName || email.split("@")[0] || "Traveler";
  const imageUrl: string | null = dbUser?.imageUrl ?? dbUser?.avatar ?? user?.photoURL ?? null;

  return { name, email, imageUrl };
}
