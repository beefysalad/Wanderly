import { io, Socket } from "socket.io-client";
import { getToken } from "./helper";
import { getGuestSession } from "./guest-session";

let socket: Socket | null = null;

/**
 * Initialize Socket.IO connection
 * Supports both authenticated users (Firebase token) and guests (group code)
 */
export async function initializeSocket(): Promise<Socket | null> {
  // Don't initialize if already connected
  if (socket?.connected) {
    return socket;
  }

  const socketUrl =
    process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8080";

  try {
    // Try to get Firebase token for authenticated users
    let token: string | undefined;
    try {
      token = await getToken();
    } catch {
      // User not authenticated, will try guest session
    }

    // Get guest session if no token
    const guestSession = !token ? getGuestSession() : null;

    // Only connect if we have either a token or a group code
    if (!token && !guestSession?.groupCode) {
      console.log("No authentication available, skipping socket connection");
      return null;
    }

    // Prepare auth object - only include defined values
    const authData: { token?: string; groupCode?: string } = {};
    if (token) {
      authData.token = token;
    }
    if (guestSession?.groupCode) {
      authData.groupCode = guestSession.groupCode;
    }

    // Double check we have at least one auth method
    if (!authData.token && !authData.groupCode) {
      console.log("No authentication available, skipping socket connection");
      return null;
    }

    console.log("Connecting to Socket.IO with auth:", {
      hasToken: !!authData.token,
      hasGroupCode: !!authData.groupCode,
    });

    // Disconnect any existing socket first
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
    }

    // Create socket connection with authentication
    socket = io(socketUrl, {
      auth: authData,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      console.log("Socket.IO connected:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket.IO disconnected:", reason);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error);
      // Disable reconnection on authentication errors
      if (
        error.message?.includes("Authentication") ||
        error.message?.includes("token") ||
        error.message?.includes("groupCode")
      ) {
        socket?.disconnect();
        socket = null;
      }
    });

    return socket;
  } catch (error) {
    console.error("Failed to initialize socket:", error);
    return null;
  }
}

/**
 * Get the current socket instance
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Disconnect socket
 */
export function disconnectSocket() {
  if (socket) {
    // Remove all listeners to prevent reconnection attempts
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

/**
 * Reconnect socket (useful when auth state changes)
 */
export async function reconnectSocket(): Promise<Socket | null> {
  disconnectSocket();
  return initializeSocket();
}
