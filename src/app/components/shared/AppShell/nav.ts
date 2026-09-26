import { Calendar, House, User, Users, type LucideIcon } from "lucide-react";

export type NavKey = "home" | "trips" | "groups" | "profile";

export interface NavItem {
  key: NavKey;
  label: string;
  /** The bottom tab bar has less room, so a couple of labels are shorter. */
  tabLabel: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { key: "home", label: "Home", tabLabel: "Home", href: "/dashboard", icon: House },
  { key: "trips", label: "Trips", tabLabel: "Trips", href: "/trips", icon: Calendar },
  { key: "groups", label: "Groups", tabLabel: "Groups", href: "/groups", icon: Users },
  { key: "profile", label: "Profile", tabLabel: "Profile", href: "/profile", icon: User },
];

/** Which nav item a page belongs to: the four top-level pages themselves, and groups for anything inside a group. The notifications page belongs to none (it opens from the bell). */
export function activeNavKey(pathname: string): NavKey | null {
  if (pathname === "/dashboard") return "home";
  if (pathname === "/group/create" || pathname === "/group/join") return "home";
  if (pathname.startsWith("/trips")) return "trips";
  if (pathname.startsWith("/notifications")) return null;
  if (pathname.startsWith("/profile")) return "profile";
  return "groups";
}

/** The group whose page is open, for highlighting it in the sidebar list. */
export function activeGroupId(pathname: string): string | null {
  const match = pathname.match(/^\/group\/([^/]+)/);
  if (!match || match[1] === "create" || match[1] === "join") return null;
  return match[1];
}
