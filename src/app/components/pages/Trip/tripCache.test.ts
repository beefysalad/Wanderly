import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import type { Group } from "@/src/shared/types";
import { patchActivityInCache, patchTripInCache } from "./tripCache";

const seed = () => {
  const client = new QueryClient();
  client.setQueryData<{ group: Group }>(["groups", "g1"], {
    group: {
      id: "g1",
      name: "Crew",
      trips: [
        {
          id: "t1",
          name: "Japan",
          status: "planning",
          activities: [
            { id: "a1", title: "Museum", done: false },
            { id: "a2", title: "Ramen", done: false },
          ],
        },
        { id: "t2", name: "Other", status: "planning", activities: [] },
      ],
    } as unknown as Group,
  });
  return client;
};

const read = (client: QueryClient) =>
  client.getQueryData<{ group: Group }>(["groups", "g1"])!.group.trips!;

describe("patchTripInCache", () => {
  it("patches only the matching trip", () => {
    const client = seed();

    patchTripInCache(client, "g1", "t1", (t) => ({ ...t, status: "finalized" }));

    expect(read(client)[0].status).toBe("finalized");
    expect(read(client)[1].status).toBe("planning");
  });

  it("does nothing when the group isn't cached", () => {
    const client = new QueryClient();

    patchTripInCache(client, "g1", "t1", (t) => t);

    expect(client.getQueryData(["groups", "g1"])).toBeUndefined();
  });
});

describe("patchActivityInCache", () => {
  it("patches only the matching activity of the matching trip", () => {
    const client = seed();

    patchActivityInCache(client, "g1", "t1", "a2", (a) => ({ ...a, done: true }));

    const [trip] = read(client);
    expect(trip.activities?.map((a) => a.done)).toEqual([false, true]);
  });

  it("can revert an optimistic change with the previous value", () => {
    const client = seed();

    patchActivityInCache(client, "g1", "t1", "a1", (a) => ({ ...a, done: true }));
    patchActivityInCache(client, "g1", "t1", "a1", (a) => ({ ...a, done: false }));

    expect(read(client)[0].activities?.[0].done).toBe(false);
  });
});
