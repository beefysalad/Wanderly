const GUEST_SESSION_KEY = "wanderly_guest_session";

export interface GuestSession {
  groupCode: string;
  guestName: string;
  groupId: string;
}

/**
 * Store guest session in localStorage
 */
export function setGuestSession(
  groupCode: string,
  guestName: string,
  groupId: string
): void {
  if (typeof window === "undefined") return;

  const session: GuestSession = {
    groupCode,
    guestName,
    groupId,
  };

  localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
}

/**
 * Retrieve guest session from localStorage
 */
export function getGuestSession(): GuestSession | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(GUEST_SESSION_KEY);
    if (!stored) return null;

    const session = JSON.parse(stored) as GuestSession;
    return session;
  } catch (error) {
    console.error("Failed to parse guest session:", error);
    return null;
  }
}

/**
 * Clear guest session from localStorage
 */
export function clearGuestSession(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(GUEST_SESSION_KEY);
}

/**
 * Check if current user is a guest
 */
export function isGuest(): boolean {
  return getGuestSession() !== null;
}

