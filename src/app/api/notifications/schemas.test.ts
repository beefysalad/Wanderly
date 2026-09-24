import { describe, expect, it } from "vitest";
import { listNotificationsQuerySchema } from "./schemas";

describe("listNotificationsQuerySchema", () => {
  it("applies defaults when no params are given", () => {
    expect(listNotificationsQuerySchema.parse({})).toEqual({ limit: 50, offset: 0 });
  });

  it("coerces query-string values and maps read to a boolean", () => {
    expect(listNotificationsQuerySchema.parse({ limit: "10", offset: "20", read: "false" })).toEqual({
      limit: 10,
      offset: 20,
      read: false,
    });
    expect(listNotificationsQuerySchema.parse({ read: "true" }).read).toBe(true);
  });

  it("rejects out-of-range or non-numeric pagination and unknown read values", () => {
    for (const bad of [{ limit: "0" }, { limit: "101" }, { limit: "abc" }, { offset: "-1" }, { read: "yes" }]) {
      expect(listNotificationsQuerySchema.safeParse(bad).success).toBe(false);
    }
  });
});
