import type { Group } from "@/src/shared/types";

/** The four numbers on the profile: groups, distinct destinations, activities and trips. */
export function profileStats(groups: Group[]) {
  const trips = groups.flatMap((group) => group.trips ?? []);
  const destinations = new Set(trips.map((trip) => trip.location?.trim().toLowerCase()).filter(Boolean));

  return [
    { label: "Groups", value: groups.length },
    { label: "Destinations", value: destinations.size },
    { label: "Activities", value: trips.reduce((sum, trip) => sum + (trip.activities?.length ?? 0), 0) },
    { label: "Trips", value: trips.length },
  ];
}

/** The vibes saved as "Foodie, Nature Lover" turned back into a list. */
export function vibesOf(travelStyle: string | undefined | null): string[] {
  return (travelStyle ?? "")
    .split(",")
    .map((vibe) => vibe.trim())
    .filter(Boolean);
}
