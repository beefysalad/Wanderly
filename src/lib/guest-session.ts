import axios from "axios";

const GUEST_SESSION_KEY = "wanderly_guest_session";

export interface GuestSession {
  groupCode: string;
  guestName: string;
  groupId: string;
  /** Server-signed, short-lived proof of access; sent on data requests instead of the code. */
  guestToken?: string;
}

/**
 * Store guest session in localStorage
 */
export function setGuestSession(
  groupCode: string,
  guestName: string,
  groupId: string,
  guestToken?: string,
): void {
  if (typeof window === "undefined") return;

  const session: GuestSession = {
    groupCode,
    guestName,
    groupId,
    guestToken,
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


/**
 * The stored code is only ever sent to validate-code (rate limited) to obtain a fresh token;
 * data requests carry the token, never the code.
 */
export async function refreshGuestToken(): Promise<string | null> {
  const session = getGuestSession();
  if (!session) return null;

  try {
    const { data } = await axios.post("/api/groups/validate-code", { code: session.groupCode });
    if (!data?.guestToken) return null;
    localStorage.setItem(
      GUEST_SESSION_KEY,
      JSON.stringify({ ...session, guestToken: data.guestToken }),
    );
    return data.guestToken;
  } catch {
    return null;
  }
}
