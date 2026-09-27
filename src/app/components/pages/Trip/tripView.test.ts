import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Activity } from "@/src/shared/types";
import {
  activitiesOn,
  activitiesOutside,
  activitySubline,
  activityTime,
  dateInputValue,
  dayKey,
  dayMeta,
  dropDate,
  monthGrids,
  tripDays,
} from "./tripView";

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

// Node re-reads TZ when it's assigned, so these run in zones far from UTC on every machine.
const inZone = (tz: string, run: () => void) => {
  describe(`in ${tz}`, () => {
    const original = process.env.TZ;
    beforeAll(() => {
      process.env.TZ = tz;
    });
    afterAll(() => {
      if (original === undefined) delete process.env.TZ;
      else process.env.TZ = original;
    });
    run();
  });
};

describe("dayKey", () => {
  it("is the local Y-M-D, zero-padded", () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  inZone("Asia/Manila", () => {
    it("keeps local midnight on its own day, not the previous UTC day", () => {
      expect(dayKey(new Date(2026, 9, 8))).toBe("2026-10-08");
    });
  });

  inZone("America/Los_Angeles", () => {
    it("keeps a late-evening time on its own day, not the next UTC day", () => {
      expect(dayKey(new Date(2026, 9, 8, 23, 30))).toBe("2026-10-08");
    });

    it("names the same day activitiesOn puts the activity under", () => {
      const day = new Date(2026, 9, 8);
      const late = act({ id: "late", date: new Date(2026, 9, 8, 23, 30).toISOString() });
      expect(activitiesOn([late], day)).toHaveLength(1);
      expect(dayKey(new Date(late.date))).toBe(dayKey(day));
    });
  });
});

describe("dropDate", () => {
  const moved = act({ id: "m", date: new Date(2026, 9, 8).toISOString() });
  const sameDayOther = act({ id: "s", date: new Date(2026, 9, 8, 9).toISOString() });
  const nextDay = act({ id: "n", date: new Date(2026, 9, 9).toISOString() });
  const all = [moved, sameDayOther, nextDay];

  it("does nothing when an activity is dropped back on its own day", () => {
    expect(dropDate(moved, dayKey(new Date(2026, 9, 8)), all)).toBeNull();
  });

  it("does nothing when dropped on another activity of the same day", () => {
    expect(dropDate(moved, "s", all)).toBeNull();
    expect(dropDate(moved, "m", all)).toBeNull();
  });

  it("moves it to another day it's dropped on", () => {
    expect(dropDate(moved, "2026-10-09", all)).toBe("2026-10-09");
  });

  it("moves it to the day of another activity it's dropped on", () => {
    expect(dropDate(moved, "n", all)).toBe(nextDay.date);
  });

  it("ignores an unknown drop target", () => {
    expect(dropDate(moved, "ghost", all)).toBeNull();
  });

  inZone("Asia/Manila", () => {
    it("does nothing on a same-day drop far from UTC", () => {
      const local = act({ id: "m", date: new Date(2026, 9, 8).toISOString() });
      expect(dropDate(local, dayKey(new Date(2026, 9, 8)), [local])).toBeNull();
    });
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

// Trip and activity dates are saved from `<input type="date">` values, i.e. as UTC midnight.
const saved = (ymd: string) => new Date(ymd).toISOString();

describe("dateInputValue", () => {
  it("gives back the day that was picked when the trip was saved", () => {
    expect(dateInputValue(saved("2026-06-01"))).toBe("2026-06-01");
  });

  inZone("America/Los_Angeles", () => {
    it("does not move the day back west of UTC, so saving an unchanged form keeps the dates", () => {
      expect(dateInputValue(saved("2026-06-01"))).toBe("2026-06-01");
    });
  });
});

describe("activitiesOutside", () => {
  const list = [
    act({ id: "before", date: saved("2026-05-31") }),
    act({ id: "first", date: saved("2026-06-01") }),
    act({ id: "last", date: saved("2026-06-10") }),
    act({ id: "after", date: saved("2026-06-11") }),
  ];

  it("lists the activities before the new start or after the new end, keeping the boundary days", () => {
    expect(activitiesOutside(list, "2026-06-01", "2026-06-10").map((a) => a.id)).toEqual(["before", "after"]);
  });

  it("lists nothing while a date field is empty", () => {
    expect(activitiesOutside(list, "", "2026-06-10")).toEqual([]);
    expect(activitiesOutside(list, "2026-06-01", "")).toEqual([]);
  });

  for (const tz of ["America/Los_Angeles", "Asia/Manila"]) {
    inZone(tz, () => {
      it("matches the days the itinerary shows the trip and its activities on", () => {
        expect(activitiesOutside(list, "2026-06-01", "2026-06-10").map((a) => a.id)).toEqual(["before", "after"]);
      });
    });
  }

  inZone("Asia/Manila", () => {
    it("keeps an activity at local midnight of the first day, which is the previous day in UTC", () => {
      const midnight = act({ id: "midnight", date: new Date(2026, 5, 1).toISOString() });
      expect(activitiesOutside([midnight], "2026-06-01", "2026-06-10")).toEqual([]);
    });
  });
});
