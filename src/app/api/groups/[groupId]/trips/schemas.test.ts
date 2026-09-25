import { describe, expect, it } from "vitest";
import { createTripSchema, updateTripSchema } from "./schemas";

const validCreate = {
  tripName: "Summer Trip",
  startDate: "2026-06-01",
  endDate: "2026-06-10",
  location: "Osaka",
  status: "planning",
};

describe("createTripSchema", () => {
  it("accepts the exact payload the create-trip form sends (empty-string location included)", () => {
    const result = createTripSchema.safeParse({ ...validCreate, location: "" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startDate).toEqual(new Date("2026-06-01"));
      expect(result.data.tripName).toBe("Summer Trip");
    }
  });

  it("defaults status to planning when omitted", () => {
    const result = createTripSchema.safeParse({
      tripName: validCreate.tripName,
      startDate: validCreate.startDate,
      endDate: validCreate.endDate,
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe("planning");
  });

  it("rejects an invalid status instead of silently defaulting", () => {
    expect(createTripSchema.safeParse({ ...validCreate, status: "bogus" }).success).toBe(false);
  });

  it("rejects a null date rather than coercing it to 1970-01-01", () => {
    expect(createTripSchema.safeParse({ ...validCreate, startDate: null }).success).toBe(false);
    expect(createTripSchema.safeParse({ ...validCreate, endDate: null }).success).toBe(false);
  });

  it("rejects an unparseable date", () => {
    expect(createTripSchema.safeParse({ ...validCreate, startDate: "not-a-date" }).success).toBe(
      false,
    );
  });

  it("rejects a start date after the end date", () => {
    const result = createTripSchema.safeParse({
      ...validCreate,
      startDate: "2026-07-01",
      endDate: "2026-06-01",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a blank trip name", () => {
    expect(createTripSchema.safeParse({ ...validCreate, tripName: "   " }).success).toBe(false);
  });

  it("accepts a null location", () => {
    expect(createTripSchema.safeParse({ ...validCreate, location: null }).success).toBe(true);
  });
});

describe("updateTripSchema", () => {
  it("accepts the status-only payload the Trip page sends", () => {
    const result = updateTripSchema.safeParse({ status: "ongoing" });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe("ongoing");
  });

  it("rejects an invalid status", () => {
    expect(updateTripSchema.safeParse({ status: "bogus" }).success).toBe(false);
  });

  it("rejects a blank name", () => {
    expect(updateTripSchema.safeParse({ name: "  " }).success).toBe(false);
  });

  it("rejects a null date rather than coercing it to 1970-01-01", () => {
    expect(updateTripSchema.safeParse({ startDate: null }).success).toBe(false);
  });

  it("allows null location so a client can clear it", () => {
    const result = updateTripSchema.safeParse({ location: null });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.location).toBeNull();
  });
});
