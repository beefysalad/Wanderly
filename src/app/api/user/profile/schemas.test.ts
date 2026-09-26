import { describe, expect, it } from "vitest";
import { updateUserProfileSchema } from "./schemas";

describe("updateUserProfileSchema", () => {
  it("accepts partial updates, including clearing nullable fields", () => {
    expect(updateUserProfileSchema.safeParse({ hasCompletedOnboarding: true }).success).toBe(true);
    expect(updateUserProfileSchema.safeParse({ bio: null, imageUrl: null }).success).toBe(true);
    expect(updateUserProfileSchema.safeParse({}).success).toBe(true);
  });

  it("keeps the onboarding wizard's travelStyle and drops unknown fields", () => {
    const result = updateUserProfileSchema.parse({ name: "Al", travelStyle: "beach", nope: 1 });

    expect(result).toEqual({ name: "Al", travelStyle: "beach" });
  });

  it("has room for several joined vibes but not unbounded text", () => {
    expect(updateUserProfileSchema.safeParse({ travelStyle: "Foodie, City, Beach, Adventure, Culture" }).success).toBe(true);
    expect(updateUserProfileSchema.safeParse({ travelStyle: "x".repeat(201) }).success).toBe(false);
  });

  it("rejects an empty name and wrongly typed values", () => {
    expect(updateUserProfileSchema.safeParse({ name: "  " }).success).toBe(false);
    expect(updateUserProfileSchema.safeParse({ name: null }).success).toBe(false);
    expect(updateUserProfileSchema.safeParse({ hasCompletedOnboarding: "yes" }).success).toBe(false);
  });
});
