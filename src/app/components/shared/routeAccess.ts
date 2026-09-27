import type { User } from "firebase/auth";

/**
 * - `public`: rendered for everyone straight away, never waits on Firebase.
 * - `guestOnly`: signed-in users are sent to the dashboard.
 * - `protected`: signed-out visitors are sent to the landing page.
 */
export type RouteAccess = "public" | "guestOnly" | "protected";

const GUEST_ONLY_ROUTES = ["/login", "/register"];
const PUBLIC_ROUTES = ["/", "/about", "/faq", "/reviews", "/how-to", "/features", "/how-it-works"];
// Guest views, invites and admin pages decide access themselves (group-code session, invite flow, admin check).
const PUBLIC_PREFIXES = ["/guest", "/invite", "/admin"];

export function routeAccess(pathname: string): RouteAccess {
  if (GUEST_ONLY_ROUTES.includes(pathname)) return "guestOnly";
  if (PUBLIC_ROUTES.includes(pathname) || PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return "public";
  }
  return "protected";
}

export interface GuardOutcome {
  render: boolean;
  redirectTo: string | null;
}

/** What a guarded route shows for the current Firebase state; public routes never reach the guard. */
export function guardOutcome(
  access: Exclude<RouteAccess, "public">,
  { user, loading }: { user: User | null; loading: boolean },
): GuardOutcome {
  if (loading) return { render: false, redirectTo: null };
  if (access === "protected" && !user) return { render: false, redirectTo: "/" };
  if (access === "guestOnly" && user) return { render: false, redirectTo: "/dashboard" };
  return { render: true, redirectTo: null };
}
