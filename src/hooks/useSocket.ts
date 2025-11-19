import { useSocketContext } from "@/components/socket-provider";

/**
 * Hook to access the Socket.IO instance
 */
export function useSocket() {
  const { socket, isConnected } = useSocketContext();
  return { socket, isConnected };
}

