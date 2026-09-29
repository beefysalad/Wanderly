import { describe, expect, it } from "vitest";
import { VIBES } from "./groupColors";
import { getGroupTheme } from "./groupTheme";

describe("getGroupTheme", () => {
  it("has a theme for every vibe, each built from its own hex", () => {
    for (const scheme of Object.keys(VIBES)) {
      const theme = getGroupTheme(scheme);
      expect(theme.dot).toBe(`bg-[${theme.hex}]`);
      expect(theme.tile).toContain(`border-[${theme.hex}]/25`);
      expect(theme.text).toBe(`text-[${theme.hex}]`);
    }
  });

  it("falls back to orange for a missing or unknown scheme", () => {
    expect(getGroupTheme(undefined).hex).toBe("#fb923c");
    expect(getGroupTheme("nope").hex).toBe("#fb923c");
  });
});
