import { describe, expect, it } from "vitest";
import { buildCreatePayload, buildUpdatePayload, getAvailableDates } from "./activityFormHelpers";
import type { TActivitySchema } from "./activitySchema";

describe("getAvailableDates", () => {
  it("lists every calendar day from startDate to endDate inclusive", () => {
    const dates = getAvailableDates({ startDate: "2026-01-01T00:00:00.000Z", endDate: "2026-01-03T00:00:00.000Z" });
    expect(dates.map((d) => d.toISOString().split("T")[0])).toEqual(["2026-01-01", "2026-01-02", "2026-01-03"]);
  });

  it("returns a single day when start and end match", () => {
    const dates = getAvailableDates({ startDate: "2026-01-01T00:00:00.000Z", endDate: "2026-01-01T00:00:00.000Z" });
    expect(dates).toHaveLength(1);
  });

  it("returns an empty list when there is no trip", () => {
    expect(getAvailableDates(null)).toEqual([]);
    expect(getAvailableDates(undefined)).toEqual([]);
  });
});

const baseValues: TActivitySchema = {
  title: "Louvre",
  date: "2026-01-02",
  startTime: "09:00",
  endTime: "11:00",
  location: "Paris",
  notes: "Bring tickets",
  transportationMode: undefined,
  pickupTime: undefined,
  pickupLocation: undefined,
  dropoffLocation: undefined,
};

describe("buildCreatePayload", () => {
  it("turns blank optional fields into undefined (nothing sent), not empty strings", () => {
    const payload = buildCreatePayload({ ...baseValues, location: "", notes: "", startTime: "", endTime: "" });
    expect(payload.location).toBeUndefined();
    expect(payload.notes).toBeUndefined();
    expect(payload.startTime).toBeUndefined();
    expect(payload.endTime).toBeUndefined();
  });

  it("passes through provided fields and casts the transportation mode", () => {
    const payload = buildCreatePayload({ ...baseValues, transportationMode: "car", pickupLocation: "Hotel", dropoffLocation: "Museum" });
    expect(payload).toMatchObject({
      title: "Louvre",
      date: "2026-01-02",
      startTime: "09:00",
      endTime: "11:00",
      location: "Paris",
      notes: "Bring tickets",
      transportationMode: "car",
      pickupLocation: "Hotel",
      dropoffLocation: "Museum",
    });
  });

  it("omits transportationMode/pickup/dropoff when unset", () => {
    const payload = buildCreatePayload(baseValues);
    expect(payload.transportationMode).toBeUndefined();
    expect(payload.pickupTime).toBeUndefined();
    expect(payload.pickupLocation).toBeUndefined();
    expect(payload.dropoffLocation).toBeUndefined();
  });
});

describe("buildUpdatePayload", () => {
  it("turns a blank location into null so the server clears it, not undefined", () => {
    const payload = buildUpdatePayload({ ...baseValues, location: "" });
    expect(payload.location).toBeNull();
  });

  it("turns an unset transportation mode into null so the server clears it", () => {
    const payload = buildUpdatePayload({ ...baseValues, transportationMode: undefined });
    expect(payload.transportationMode).toBeNull();
  });

  it("casts a provided transportation mode through unchanged", () => {
    const payload = buildUpdatePayload({ ...baseValues, transportationMode: "plane" });
    expect(payload.transportationMode).toBe("plane");
  });

  it("passes time/notes fields through as-is (including empty string, unlike create)", () => {
    const payload = buildUpdatePayload({ ...baseValues, startTime: "", notes: "" });
    expect(payload.startTime).toBe("");
    expect(payload.notes).toBe("");
  });
});
