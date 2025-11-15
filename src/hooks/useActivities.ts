import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Activity } from "@/src/shared/types";

interface ActivityResponse {
  activity: Activity;
}

interface CreateActivityRequest {
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
}

interface UpdateActivityRequest {
  title?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
  done?: boolean;
}

/**
 * Mutation hook to create a new activity for a trip
 */
export function useCreateActivity(tripId: string, groupId: string) {
  const queryClient = useQueryClient();

  return useMutation<ActivityResponse, Error, CreateActivityRequest>({
    mutationFn: async (data) => {
      const response = await api.post<ActivityResponse>(
        `/trips/${tripId}/activities`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate group query to refetch with new activity
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
    },
  });
}

/**
 * Mutation hook to update an activity
 */
export function useUpdateActivity(tripId: string, activityId: string, groupId: string) {
  const queryClient = useQueryClient();

  return useMutation<ActivityResponse, Error, UpdateActivityRequest>({
    mutationFn: async (data) => {
      const response = await api.patch<ActivityResponse>(
        `/trips/${tripId}/activities/${activityId}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate group query to refetch with updated activity
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
    },
  });
}

/**
 * Mutation hook to delete an activity
 */
export function useDeleteActivity(tripId: string, activityId: string, groupId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await api.delete(`/trips/${tripId}/activities/${activityId}`);
    },
    onSuccess: () => {
      // Invalidate group query to refetch without deleted activity
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
    },
  });
}

