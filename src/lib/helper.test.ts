import { describe, expect, it } from "vitest";
import packageJson from "@/package.json";
import { getAppVersion } from "./helper";

describe("getAppVersion", () => {
  it("derives the displayed version from package.json instead of a separate hardcoded constant", () => {
    expect(getAppVersion()).toBe(`v${packageJson.version}`);
  });
});
