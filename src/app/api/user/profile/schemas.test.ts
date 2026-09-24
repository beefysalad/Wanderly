import { describe, expect, it } from "vitest";
import { updateUserProfileSchema } from "./schemas";

describe("updateUserProfileSchema", () => {
  it("accepts partial updates, including clearing nullable fields", () => {
    expect(updateUserProfileSchema.safeParse({ hasCompletedOnboarding: true }).success).toBe(true);
    expect(updateUserProfileSchema.safeParse({ bio: null, imageUrl: null }).success).toBe(true);
    expect(updateUserProfileSchema.safeParse({}).success).toBe(true);
  });

  it("drops unknown fields such as the wizard's travelStyle", () => {
    const result = updateUserProfileSchema.parse({ name: "Al", travelStyle: "beach" });

    expect(result).toEqual({ name: "Al" });
  });

  it("rejects an empty name and wrongly typed values", () => {
    expect(updateUserProfileSchema.safeParse({ name: "  " }).success).toBe(false);
    expect(updateUserProfileSchema.safeParse({ name: null }).success).toBe(false);
    expect(updateUserProfileSchema.safeParse({ hasCompletedOnboarding: "yes" }).success).toBe(false);
  });
});
