import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "./useSocket";
import { queryKeys } from "./queryKeys";

/**
 * Hook to listen for real-time notification events via Socket.IO
 * Automatically invalidates queries when notifications are received
 */
export function useSocketNotifications() {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    const handleNotification = () => {
      // Covers every notification list and the unread count
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  }, [socket, queryClient]);
}
