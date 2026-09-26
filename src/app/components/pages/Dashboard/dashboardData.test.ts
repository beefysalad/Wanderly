import { describe, expect, it } from "vitest";
import type { Group, Trip } from "@/src/shared/types";
import {
  allTrips,
  buildMonthCells,
  dateEyebrow,
  dateTile,
  dayDiff,
  fullRange,
  pastTrips,
  shortRange,
  tripCountdown,
  tripMeta,
  tripWhen,
  upcomingTrips,
} from "./dashboardData";

const TODAY = new Date(2026, 8, 26); // Sat, Sep 26 2026

const trip = (id: string, start: [number, number, number], end: [number, number, number], extra: Partial<Trip> = {}): Trip => ({
  id,
  groupId: "g1",
  name: id,
  startDate: new Date(start[0], start[1], start[2]).toISOString(),
  endDate: new Date(end[0], end[1], end[2]).toISOString(),
  activities: [],
  createdAt: "",
  ...extra,
});

const group = (trips: Trip[], colorScheme = "cyan"): Group => ({ id: "g1", name: "Paraluman", code: "ABC123", createdAt: "", colorScheme, trips });

const siargao = trip("siargao", [2026, 9, 8], [2026, 9, 12]);
const coron = trip("coron", [2026, 11, 28], [2026, 11, 31]);
const batangas = trip("batangas", [2026, 7, 1], [2026, 7, 3]);
const now = trip("now", [2026, 8, 24], [2026, 8, 28]);
const cancelled = trip("cancelled", [2026, 9, 1], [2026, 9, 2], { status: "cancelled" });
const all = allTrips([group([coron, siargao, batangas, now, cancelled])]);

describe("upcoming and past trips", () => {
  it("lists what is running or still ahead, soonest first, without cancelled trips", () => {
    expect(upcomingTrips(all, TODAY).map((t) => t.id)).toEqual(["now", "siargao", "coron"]);
  });

  it("lists finished trips, most recent first", () => {
    expect(pastTrips(all, TODAY).map((t) => t.id)).toEqual(["batangas"]);
  });

  it("attaches the group to each trip", () => {
    expect(all[0].group.name).toBe("Paraluman");
  });
});

describe("tripWhen and tripCountdown", () => {
  it("says past, now, tomorrow or in N days", () => {
    expect(tripWhen(batangas, TODAY)).toBe("Past");
    expect(tripWhen(now, TODAY)).toBe("Happening now");
    expect(tripWhen(trip("t", [2026, 8, 27], [2026, 8, 28]), TODAY)).toBe("Tomorrow");
    expect(tripWhen(siargao, TODAY)).toBe("in 12 days");
  });

  it("gives the countdown tile its number and caption", () => {
    expect(tripCountdown(siargao, TODAY)).toEqual({ big: "12", small: " days to go" });
    expect(tripCountdown(trip("t", [2026, 8, 27], [2026, 8, 28]), TODAY)).toEqual({ big: "1", small: " day to go" });
    expect(tripCountdown(now, TODAY)).toEqual({ big: "Now", small: " happening" });
  });
});

describe("date formatting", () => {
  it("formats ranges within and across months", () => {
    expect(shortRange(siargao)).toBe("Oct 8 – 12");
    expect(shortRange(trip("x", [2026, 9, 30], [2026, 10, 2]))).toBe("Oct 30 – Nov 2");
    expect(fullRange(siargao)).toBe("Oct 8 – 12, 2026");
  });

  it("describes length and activities", () => {
    expect(tripMeta(siargao)).toBe("5 days · 0 activities");
    expect(tripMeta({ ...siargao, activities: [{ id: "a" } as never] })).toBe("5 days · 1 activity");
  });

  it("formats the header date and the agenda tile", () => {
    expect(dateEyebrow(TODAY)).toBe("Saturday · Sep 26");
    expect(dateTile(siargao)).toEqual({ month: "OCT", day: 8 });
    expect(dayDiff(TODAY, siargao.startDate as unknown as Date)).toBe(12);
  });
});

describe("buildMonthCells", () => {
  it("pads to the first weekday and marks today and trip days", () => {
    const cells = buildMonthCells(2026, 8, all, TODAY); // September 2026 starts on a Tuesday
    expect(cells.filter((c) => c.day === null)).toHaveLength(2);
    const today = cells.find((c) => c.isToday);
    expect(today?.day).toBe(26);
    expect(today?.schemes).toEqual(["cyan"]); // "now" covers Sep 24–28
    expect(cells.find((c) => c.day === 1)?.schemes).toEqual([]);
  });

  it("caps the bars at three trips per day", () => {
    const many = allTrips([group([1, 2, 3, 4].map((n) => trip(`t${n}`, [2026, 8, 20], [2026, 8, 30])))]);
    expect(buildMonthCells(2026, 8, many, TODAY).find((c) => c.day === 25)?.schemes).toHaveLength(3);
  });
});
