import { describe, expect, it } from "vitest";
import { formatTime12Hour } from "@/lib/utils";

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
