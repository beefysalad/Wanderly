import { describe, expect, it } from "vitest";
import { getTripStatus } from "./tripStatus";

describe("getTripStatus", () => {
  it("knows the four statuses", () => {
    expect(getTripStatus("finalized").label).toBe("Finalized");
    expect(getTripStatus("cancelled").key).toBe("cancelled");
  });

  it("treats a missing or unknown status as planning", () => {
    expect(getTripStatus(undefined).key).toBe("planning");
    expect(getTripStatus("weird").label).toBe("Planning");
  });
});
