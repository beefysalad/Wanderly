import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Trip, Group } from "@/src/shared/types";

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
      queryClient.setQueryData<{ group: Group }>(["groups", groupId], (old) => {
        if (!old) return old;
        return {
          group: {
            ...old.group,
            trips: [...(old.group.trips || []), data.trip],
          },
        };
      });

      // Also invalidate to ensure fresh data
      await queryClient.refetchQueries({ queryKey: ["groups", groupId] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}
