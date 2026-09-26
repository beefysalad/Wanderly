import { describe, expect, it } from "vitest";
import type { Group } from "@/src/shared/types";
import { profileStats, vibesOf } from "./profileView";

const trip = (location: string | undefined, activities: number) => ({ location, activities: Array.from({ length: activities }) }) as never;

describe("profileStats", () => {
  it("counts groups, distinct destinations, activities and trips", () => {
    const groups = [
      { trips: [trip("Siargao", 5), trip("siargao ", 2)] },
      { trips: [trip("Coron", 3), trip(undefined, 0)] },
      { trips: undefined },
    ] as unknown as Group[];
    expect(profileStats(groups)).toEqual([
      { label: "Groups", value: 3 },
      { label: "Destinations", value: 2 },
      { label: "Activities", value: 10 },
      { label: "Trips", value: 4 },
    ]);
  });
});

describe("vibesOf", () => {
  it("splits a comma list and drops blanks", () => {
    expect(vibesOf("Foodie, Nature Lover")).toEqual(["Foodie", "Nature Lover"]);
    expect(vibesOf("")).toEqual([]);
    expect(vibesOf(undefined)).toEqual([]);
  });
});
