import { useEffect, useState } from "react";
import {
  getGuestSession,
  clearGuestSession,
  type GuestSession,
} from "@/lib/guest-session";
import { useCurrentUser } from "./useCurrentUser";

/**
 * Hook to check if user is in guest mode
 * Returns guest info if guest, null if authenticated user
 */
export function useGuest(): GuestSession | null {
  const { user } = useCurrentUser();
  const [guestSession, setGuestSession] = useState<GuestSession | null>(null);

  useEffect(() => {
    // If user is authenticated, clear guest session
    if (user) {
      clearGuestSession();
      setGuestSession(null);
    } else {
      // If not authenticated, check for guest session
      const session = getGuestSession();
      setGuestSession(session);
    }
  }, [user]);

  // Return null if authenticated, guest session if guest
  return user ? null : guestSession;
}

