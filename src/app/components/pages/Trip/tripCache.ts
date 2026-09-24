import type { QueryClient } from "@tanstack/react-query";
import type { Activity, Group, Trip } from "@/src/shared/types";

/** Optimistically patches one trip inside the cached group. */
export function patchTripInCache(
  queryClient: QueryClient,
  groupId: string,
  tripId: string,
  patch: (trip: Trip) => Trip,
) {
  queryClient.setQueryData<{ group: Group }>(["groups", groupId], (old) => {
    if (!old) return old;
    return {
      group: {
        ...old.group,
        trips: old.group.trips?.map((t) => (t.id === tripId ? patch(t) : t)),
      },
    };
  });
}

/** Optimistically patches one activity inside the cached group's trip. */
export function patchActivityInCache(
  queryClient: QueryClient,
  groupId: string,
  tripId: string,
  activityId: string,
  patch: (activity: Activity) => Activity,
) {
  patchTripInCache(queryClient, groupId, tripId, (trip) => ({
    ...trip,
    activities: trip.activities?.map((a) => (a.id === activityId ? patch(a) : a)),
  }));
}
