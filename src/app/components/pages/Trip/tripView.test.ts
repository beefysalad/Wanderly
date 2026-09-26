import { describe, expect, it } from "vitest";
import type { Activity } from "@/src/shared/types";
import { activitiesOn, activitySubline, activityTime, dayKey, dayMeta, monthGrids, tripDays } from "./tripView";

const act = (over: Partial<Activity>): Activity => ({ id: "a", date: new Date(2026, 9, 8).toISOString(), title: "x", done: false, ...over });

describe("tripDays", () => {
  it("lists every day from start to end, inclusive", () => {
    const days = tripDays(new Date(2026, 9, 8), new Date(2026, 9, 10));
    expect(days.map((d) => d.getDate())).toEqual([8, 9, 10]);
  });

  it("is a single day when start and end match", () => {
    expect(tripDays(new Date(2026, 9, 8), new Date(2026, 9, 8))).toHaveLength(1);
  });
});

describe("dayKey", () => {
  it("is the ISO date, the id a day drops onto", () => {
    expect(dayKey(new Date("2026-10-08T00:00:00.000Z"))).toBe("2026-10-08");
  });
});

describe("activitiesOn", () => {
  const day = new Date(2026, 9, 8);
  it("keeps only that day's activities, earliest first with untimed ones last", () => {
    const list = [
      act({ id: "late", startTime: "15:00" }),
      act({ id: "none" }),
      act({ id: "early", startTime: "06:30" }),
      act({ id: "other", date: new Date(2026, 9, 9).toISOString(), startTime: "01:00" }),
    ];
    expect(activitiesOn(list, day).map((a) => a.id)).toEqual(["early", "late", "none"]);
  });
});

describe("activityTime and activitySubline", () => {
  it("formats the start time, falls back to pickup, or gives null", () => {
    expect(activityTime(act({ startTime: "06:30" }))).toBe("6:30 AM");
    expect(activityTime(act({ pickupTime: "13:00" }))).toBe("1:00 PM");
    expect(activityTime(act({}))).toBeNull();
  });

  it("combines transport and place, else shows the notes", () => {
    expect(activitySubline(act({ transportationMode: "bus", pickupLocation: "Hostel" }))).toBe("🚌 bus · Hostel");
    expect(activitySubline(act({ pickupLocation: "Pier" }))).toBe("Pier");
    expect(activitySubline(act({ notes: "Bring sunscreen" }))).toBe("Bring sunscreen");
    expect(activitySubline(act({}))).toBe("");
  });
});

describe("dayMeta", () => {
  it("reads 'Day n of N'", () => {
    expect(dayMeta(1, 5, 4)).toBe("Day 2 of 5 · 4 activities planned");
    expect(dayMeta(0, 1, 1)).toBe("Day 1 of 1 · 1 activity planned");
  });
});

describe("monthGrids", () => {
  it("makes one grid per month the trip touches, marking trip days and their activity counts", () => {
    const start = new Date(2026, 9, 30);
    const end = new Date(2026, 10, 2);
    const grids = monthGrids(start, end, [act({ id: "a", date: new Date(2026, 10, 1).toISOString() })]);

    expect(grids.map((g) => g.label)).toEqual(["October 2026", "November 2026"]);
    const oct = grids[0].cells.filter((c) => c.day !== null);
    expect(oct).toHaveLength(31);
    expect(oct.find((c) => c.day === 30)?.tripDay).toBe(0);
    expect(oct.find((c) => c.day === 29)?.tripDay).toBeNull();
    const nov = grids[1].cells.filter((c) => c.day !== null);
    expect(nov.find((c) => c.day === 1)).toMatchObject({ tripDay: 2, count: 1 });
    expect(nov.find((c) => c.day === 2)).toMatchObject({ tripDay: 3, count: 0 });
  });

  it("pads the first row to the weekday of the 1st", () => {
    const grids = monthGrids(new Date(2026, 9, 8), new Date(2026, 9, 9), []);
    expect(grids[0].cells.filter((c) => c.day === null)).toHaveLength(new Date(2026, 9, 1).getDay());
  });
});
