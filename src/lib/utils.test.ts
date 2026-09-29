import { describe, expect, it } from "vitest";
import { formatTime12Hour, safeRedirectPath } from "@/src/lib/utils";

describe("formatTime12Hour", () => {
  it("converts a morning time", () => {
    expect(formatTime12Hour("09:00")).toBe("9:00 AM");
  });

  it("converts an afternoon time", () => {
    expect(formatTime12Hour("14:30")).toBe("2:30 PM");
  });

  it("converts midnight to 12 AM", () => {
    expect(formatTime12Hour("00:00")).toBe("12:00 AM");
  });

  it("converts noon to 12 PM", () => {
    expect(formatTime12Hour("12:00")).toBe("12:00 PM");
  });

  it("returns an empty string unchanged", () => {
    expect(formatTime12Hour("")).toBe("");
  });
});

describe("safeRedirectPath", () => {
  it("accepts a same-origin path", () => {
    expect(safeRedirectPath("/group/123/trip/456")).toBe("/group/123/trip/456");
  });

  it("falls back for a missing value", () => {
    expect(safeRedirectPath(null)).toBe("/dashboard");
    expect(safeRedirectPath(undefined)).toBe("/dashboard");
    expect(safeRedirectPath("")).toBe("/dashboard");
  });

  it("falls back for a protocol-relative host (//evil.com)", () => {
    expect(safeRedirectPath("//evil.com")).toBe("/dashboard");
  });

  it("falls back for an absolute URL to another origin", () => {
    expect(safeRedirectPath("https://evil.com")).toBe("/dashboard");
  });

  it("falls back for a path with no leading slash", () => {
    expect(safeRedirectPath("evil.com")).toBe("/dashboard");
  });

  it("uses a custom fallback when given one", () => {
    expect(safeRedirectPath("https://evil.com", "/login")).toBe("/login");
  });
});
