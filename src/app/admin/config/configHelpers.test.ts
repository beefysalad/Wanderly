import { describe, expect, it } from "vitest";
import { AlertTriangle, Bell, Layout, Settings, Shield } from "lucide-react";
import { getConfigIcon, parseMaintenanceConfig, type ConfigItem } from "./configHelpers";

describe("getConfigIcon", () => {
  it("maps well-known key substrings to their icon", () => {
    expect(getConfigIcon("maintenance-mode")).toBe(AlertTriangle);
    expect(getConfigIcon("whats-new")).toBe(Layout);
    expect(getConfigIcon("notification-settings")).toBe(Bell);
    expect(getConfigIcon("auth-provider")).toBe(Shield);
    expect(getConfigIcon("security-policy")).toBe(Shield);
  });

  it("falls back to a generic settings icon for anything else", () => {
    expect(getConfigIcon("site-banner")).toBe(Settings);
  });
});

const config = (value: unknown, key = "maintenance-mode"): ConfigItem => ({ key, value, updatedAt: new Date().toISOString() });

describe("parseMaintenanceConfig", () => {
  it("is off with the default estimate when there's no maintenance-mode config yet", () => {
    expect(parseMaintenanceConfig([])).toEqual({ enabled: false, estimateDefault: "30-60 Minutes" });
  });

  it("reads the legacy boolean shape (value: true/false) with the default estimate", () => {
    expect(parseMaintenanceConfig([config(true)])).toEqual({ enabled: true, estimateDefault: "30-60 Minutes" });
    expect(parseMaintenanceConfig([config(false)])).toEqual({ enabled: false, estimateDefault: "30-60 Minutes" });
  });

  it("reads the object shape's enabled flag and estimate", () => {
    expect(parseMaintenanceConfig([config({ enabled: true, estimate: "10-20 Minutes" })])).toEqual({
      enabled: true,
      estimateDefault: "10-20 Minutes",
    });
  });

  it("treats a missing estimate on the object shape as blank, not the default text", () => {
    expect(parseMaintenanceConfig([config({ enabled: true })])).toEqual({ enabled: true, estimateDefault: "" });
  });

  it("ignores other configs and only looks at the maintenance-mode key", () => {
    const configs = [config("whatever", "other-key"), config({ enabled: true, estimate: "5 Minutes" })];
    expect(parseMaintenanceConfig(configs)).toEqual({ enabled: true, estimateDefault: "5 Minutes" });
  });
});
