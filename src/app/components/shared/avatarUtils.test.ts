import { describe, expect, it } from "vitest";
import { initialsOf, paletteFor } from "./avatarUtils";

describe("initialsOf", () => {
  it("uses the first and last word, or the first two letters of a single name", () => {
    expect(initialsOf("Patrick Tan")).toBe("PT");
    expect(initialsOf("Maria Clara de la Cruz")).toBe("MC");
    expect(initialsOf("mj")).toBe("MJ");
    expect(initialsOf("   ")).toBe("?");
  });
});

describe("paletteFor", () => {
  it("gives the same colour for the same key and always a palette entry", () => {
    expect(paletteFor("a@x.com")).toBe(paletteFor("a@x.com"));
    expect(paletteFor("a@x.com")).toMatch(/^bg-\[#/);
  });
});
