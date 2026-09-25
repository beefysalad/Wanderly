import { describe, expect, it } from "vitest";
import { buildBioUpdate, buildProfileUpdates } from "./onboardingProfile";

describe("buildBioUpdate", () => {
  it("leaves the bio alone when nothing was answered", () => {
    expect(buildBioUpdate("Hi", "", "")).toBe("Hi");
  });

  it("adds the bucket list and crew on their own lines", () => {
    expect(buildBioUpdate("", "Japan", "Couple")).toBe("Dreaming of Japan 🌍\nTravels as a Couple 💑");
    expect(buildBioUpdate("Hi", "Peru", "Solo")).toBe("Hi\nDreaming of Peru 🌍\nSolo Traveler 🎒");
  });

  it("does not repeat text already in the bio", () => {
    const bio = "Dreaming of Peru 🌍\nSolo Traveler 🎒";

    expect(buildBioUpdate(bio, "Japan", "Solo")).toBe(bio);
  });

  it("ignores an unknown crew id", () => {
    expect(buildBioUpdate("Hi", "", "Robots")).toBe("Hi");
  });

  it("supports every crew", () => {
    expect(buildBioUpdate("", "", "Friends")).toBe("Travels with Friends 👯‍♂️");
    expect(buildBioUpdate("", "", "Family")).toBe("Travels with Family 👨‍👩‍👧‍👦");
  });
});

describe("buildProfileUpdates", () => {
  const empty = { displayName: "", imageUrl: "", bucketList: "", selectedVibes: [], selectedCrew: "" };

  it("sends nothing when nothing was filled in", () => {
    expect(buildProfileUpdates("Hi", empty)).toEqual({});
  });

  it("includes only the filled fields, joining vibes", () => {
    expect(
      buildProfileUpdates("", {
        ...empty,
        displayName: "Al",
        imageUrl: "a.png",
        selectedVibes: ["Foodie", "City"],
      }),
    ).toEqual({ name: "Al", imageUrl: "a.png", travelStyle: "Foodie, City" });
  });

  it("includes the bio only when the answers change it", () => {
    expect(buildProfileUpdates("Hi", { ...empty, bucketList: "Peru" }).bio).toBe("Hi\nDreaming of Peru 🌍");
    expect(buildProfileUpdates("Hi", empty)).not.toHaveProperty("bio");
  });
});
