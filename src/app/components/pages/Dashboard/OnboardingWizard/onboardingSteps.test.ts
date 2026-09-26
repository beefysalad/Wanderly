import { describe, expect, it } from "vitest";
import { canContinue, continueLabel, nextStep, previousStep, savesProfile, showsBottomBar, stepNumber } from "./onboardingSteps";

const idle = { isUploading: false, isSubmitting: false, vibeCount: 0, crew: "" };

describe("step order", () => {
  it("numbers the six steps and walks forwards and backwards", () => {
    expect(stepNumber("WELCOME")).toBe(1);
    expect(stepNumber("ACTION")).toBe(6);
    expect(nextStep("IDENTITY")).toBe("DNA");
    expect(previousStep("DNA")).toBe("IDENTITY");
    expect(previousStep("WELCOME")).toBeNull();
    expect(nextStep("ACTION")).toBeNull();
  });
});

describe("bottom bar", () => {
  it("shows on the four middle steps only, each with its own label", () => {
    expect(showsBottomBar("WELCOME")).toBe(false);
    expect(showsBottomBar("ACTION")).toBe(false);
    expect(["IDENTITY", "DNA", "CREW", "TUTORIAL"].every((s) => showsBottomBar(s as never))).toBe(true);
    expect(continueLabel("DNA")).toBe("Next step");
    expect(continueLabel("TUTORIAL")).toBe("I'm ready");
  });

  it("saves the profile after identity, vibe and crew but not after the tour", () => {
    expect(savesProfile("IDENTITY")).toBe(true);
    expect(savesProfile("CREW")).toBe(true);
    expect(savesProfile("TUTORIAL")).toBe(false);
  });
});

describe("canContinue", () => {
  it("needs at least one vibe and a crew, and waits for uploads and saves", () => {
    expect(canContinue("DNA", idle)).toBe(false);
    expect(canContinue("DNA", { ...idle, vibeCount: 2 })).toBe(true);
    expect(canContinue("CREW", idle)).toBe(false);
    expect(canContinue("CREW", { ...idle, crew: "Friends" })).toBe(true);
    expect(canContinue("IDENTITY", { ...idle, isUploading: true })).toBe(false);
    expect(canContinue("IDENTITY", idle)).toBe(true);
    expect(canContinue("TUTORIAL", { ...idle, isSubmitting: true })).toBe(false);
  });
});
