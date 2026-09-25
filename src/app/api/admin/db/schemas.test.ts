import { describe, expect, it } from "vitest";
import { maintenanceSchema } from "./schemas";

describe("maintenanceSchema", () => {
  it("accepts the known action only", () => {
    expect(maintenanceSchema.safeParse({ action: "clean-test-data" }).success).toBe(true);
    expect(maintenanceSchema.safeParse({ action: "drop-everything" }).success).toBe(false);
    expect(maintenanceSchema.safeParse({}).success).toBe(false);
  });
});
