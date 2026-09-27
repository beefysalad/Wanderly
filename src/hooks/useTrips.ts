import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Trip, Group } from "@/src/shared/types";
import { queryKeys } from "./queryKeys";

interface TripResponse {
  trip: Trip;
}

interface CreateTripRequest {
  tripName: string;
  startDate: string;
  endDate: string;
  location?: string;
  status: "planning" | "finalized" | "ongoing" | "cancelled";
}

/**
 * Mutation hook to create a new trip for a group
 */
export function useCreateTrip(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation<TripResponse, Error, CreateTripRequest>({
    mutationFn: async (data) => {
      const response = await api.post<TripResponse>(
        `/groups/${groupId}/trips`,
        data
      );
      return response.data;
    },
    onSuccess: async (data) => {
      // Optimistically update the group cache with the new trip
      queryClient.setQueryData<{ group: Group }>(queryKeys.groups.detail(groupId), (old) => {
        if (!old) return old;
        return {
          group: {
            ...old.group,
            trips: [...(old.group.trips || []), data.trip],
          },
        };
      });

      // Also invalidate to ensure fresh data
      await queryClient.refetchQueries({ queryKey: queryKeys.groups.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
      // Toast will be shown via Socket.IO event to avoid duplicates
    },
  });
}

/**
 * Mutation hook to delete a trip
 */
export function useDeleteTrip(groupId: string, tripId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await api.delete(`/groups/${groupId}/trips/${tripId}`);
    },
    onSuccess: () => {
      // Invalidate group query to refetch without deleted trip
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
      // Toast will be shown via Socket.IO event to avoid duplicates
    },
  });
}
