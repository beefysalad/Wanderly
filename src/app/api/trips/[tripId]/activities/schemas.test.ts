import { describe, expect, it } from "vitest";
import { createActivitySchema, updateActivitySchema } from "./schemas";

const messages = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe("createActivitySchema", () => {
  it("accepts a minimal payload and coerces the date", () => {
    const result = createActivitySchema.safeParse({ title: "Museum", date: "2026-10-01" });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.date).toBeInstanceOf(Date);
  });

  it("rejects a missing or blank title", () => {
    expect(createActivitySchema.safeParse({ date: "2026-10-01" }).success).toBe(false);
    expect(createActivitySchema.safeParse({ title: "  ", date: "2026-10-01" }).success).toBe(false);
  });

  it("rejects missing, null, empty, and unparseable dates", () => {
    for (const date of [undefined, null, "", "not-a-date"]) {
      expect(createActivitySchema.safeParse({ title: "x", date }).success).toBe(false);
    }
  });

  it("accepts HH:mm times, empty or null times, and an end equal to the start", () => {
    const base = { title: "x", date: "2026-10-01" };
    expect(createActivitySchema.safeParse({ ...base, startTime: "00:00", endTime: "23:59" }).success).toBe(true);
    expect(createActivitySchema.safeParse({ ...base, startTime: "09:30", endTime: "09:30" }).success).toBe(true);
    expect(createActivitySchema.safeParse({ ...base, startTime: "", endTime: null }).success).toBe(true);
  });

  it("rejects times that aren't 24-hour HH:mm", () => {
    for (const time of ["9:30", "24:00", "12:60", "12:30:00", "9am", "12.30"]) {
      const result = createActivitySchema.safeParse({ title: "x", date: "2026-10-01", startTime: time });
      expect(result.success, time).toBe(false);
      expect(messages(result)).toContain("Use a 24-hour time like 09:30");
    }
  });

  it("rejects an end time before the start time, on endTime", () => {
    const result = createActivitySchema.safeParse({
      title: "x",
      date: "2026-10-01",
      startTime: "14:00",
      endTime: "09:59",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      expect.objectContaining({ path: ["endTime"], message: "End time can't be before the start time" }),
    ]);
  });

  it("allows either time on its own", () => {
    const base = { title: "x", date: "2026-10-01" };
    expect(createActivitySchema.safeParse({ ...base, startTime: "14:00" }).success).toBe(true);
    expect(createActivitySchema.safeParse({ ...base, endTime: "09:00" }).success).toBe(true);
  });

  it("trims the location and caps it at 200 characters", () => {
    const base = { title: "x", date: "2026-10-01" };
    const ok = createActivitySchema.safeParse({ ...base, location: "  Louvre, Paris " });
    expect(ok.data?.location).toBe("Louvre, Paris");
    expect(createActivitySchema.safeParse({ ...base, location: "a".repeat(200) }).success).toBe(true);
    expect(createActivitySchema.safeParse({ ...base, location: "a".repeat(201) }).success).toBe(false);
  });
});

describe("updateActivitySchema", () => {
  it("accepts a partial update and null detail fields", () => {
    expect(updateActivitySchema.safeParse({ done: true }).success).toBe(true);
    expect(updateActivitySchema.safeParse({ pickupTime: null, notes: "" }).success).toBe(true);
  });

  it("rejects null/empty dates and an empty title", () => {
    expect(updateActivitySchema.safeParse({ date: null }).success).toBe(false);
    expect(updateActivitySchema.safeParse({ date: "" }).success).toBe(false);
    expect(updateActivitySchema.safeParse({ title: "" }).success).toBe(false);
  });

  it("validates time format and order the same way", () => {
    expect(updateActivitySchema.safeParse({ endTime: "25:00" }).success).toBe(false);
    const result = updateActivitySchema.safeParse({ startTime: "10:00", endTime: "09:00" });
    expect(result.success).toBe(false);
    expect(messages(result)).toEqual(["End time can't be before the start time"]);
    expect(updateActivitySchema.safeParse({ startTime: "10:00", endTime: "10:30" }).success).toBe(true);
  });

  it("accepts clearing the location", () => {
    expect(updateActivitySchema.safeParse({ location: null }).success).toBe(true);
    expect(updateActivitySchema.safeParse({ location: "" }).success).toBe(true);
  });
});
