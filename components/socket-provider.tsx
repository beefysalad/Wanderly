"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Socket } from "socket.io-client";
import { disconnectSocket, reconnectSocket } from "@/lib/socket";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getGuestSession } from "@/lib/guest-session";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export function useSocketContext() {
  return useContext(SocketContext);
}

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Listen for auth state changes and connect/reconnect accordingly
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;

      const guestSession = getGuestSession();

      // Only connect if we have either a user or a guest session
      if (user || guestSession) {
        try {
          const newSocket = await reconnectSocket();
          if (newSocket && mounted) {
            setSocket(newSocket);
            setIsConnected(newSocket.connected);

            newSocket.on("connect", () => {
              if (mounted) setIsConnected(true);
            });

            newSocket.on("disconnect", () => {
              if (mounted) setIsConnected(false);
            });

            newSocket.on("connect_error", (error) => {
              console.error("Socket connection error:", error);
              if (mounted) setIsConnected(false);
            });
          }
        } catch (error) {
          console.error("Failed to initialize socket:", error);
          if (mounted) {
            setSocket(null);
            setIsConnected(false);
          }
        }
      } else {
        // No user and no guest session, disconnect
        disconnectSocket();
        if (mounted) {
          setSocket(null);
          setIsConnected(false);
        }
      }
    });

    // Cleanup on unmount
    return () => {
      mounted = false;
      unsubscribe();
      disconnectSocket();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
