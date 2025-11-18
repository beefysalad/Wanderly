import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Notification } from "@/src/shared/types";

interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  hasMore: boolean;
}

interface UnreadCountResponse {
  count: number;
}

interface MarkReadResponse {
  notification: Notification;
}

interface MarkAllReadResponse {
  count: number;
}

/**
 * Query hook to fetch notifications with pagination
 */
export function useNotifications(options?: {
  limit?: number;
  offset?: number;
  read?: boolean;
}) {
  return useQuery<NotificationsResponse>({
    queryKey: ["notifications", options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.limit) params.append("limit", options.limit.toString());
      if (options?.offset) params.append("offset", options.offset.toString());
      if (options?.read !== undefined)
        params.append("read", options.read.toString());

      const response = await api.get<NotificationsResponse>(
        `/notifications?${params.toString()}`
      );
      return response.data;
    },
    refetchInterval: 30000, // Poll every 30 seconds for new notifications
  });
}

/**
 * Query hook to fetch unread notification count
 */
export function useUnreadCount() {
  return useQuery<UnreadCountResponse>({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const response = await api.get<UnreadCountResponse>(
        "/notifications/unread-count"
      );
      return response.data;
    },
    refetchInterval: 30000, // Poll every 30 seconds
  });
}

/**
 * Mutation hook to mark a notification as read
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation<MarkReadResponse, Error, string>({
    mutationFn: async (notificationId) => {
      const response = await api.post<MarkReadResponse>(
        `/notifications/${notificationId}/read`
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate notifications list and unread count
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    },
  });
}

/**
 * Mutation hook to mark all notifications as read
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation<MarkAllReadResponse, Error, void>({
    mutationFn: async () => {
      const response = await api.post<MarkAllReadResponse>(
        "/notifications/read-all"
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate notifications list and unread count
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    },
  });
}

