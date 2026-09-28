import { AlertTriangle, Bell, Layout, Settings, Shield, type LucideIcon } from "lucide-react";

export interface ConfigItem {
  key: string;
  value: unknown;
  updatedAt: string;
}

/** The icon shown next to a config key, guessed from well-known substrings. */
export function getConfigIcon(key: string): LucideIcon {
  if (key.includes("maintenance")) return AlertTriangle;
  if (key.includes("whats-new")) return Layout;
  if (key.includes("notification")) return Bell;
  if (key.includes("auth") || key.includes("security")) return Shield;
  return Settings;
}

export interface MaintenanceConfigState {
  enabled: boolean;
  /** What the estimate field should show: the saved estimate, blank if the config has no estimate, or the placeholder default if maintenance mode was never configured. */
  estimateDefault: string;
}

/** The maintenance-mode config supports both a legacy `boolean` value and a newer `{ enabled, estimate }` object. */
export function parseMaintenanceConfig(configs: ConfigItem[]): MaintenanceConfigState {
  const config = configs.find((c) => c.key === "maintenance-mode");
  const isObjectShape = typeof config?.value === "object" && config?.value !== null;

  if (isObjectShape) {
    const value = config!.value as { enabled?: boolean; estimate?: string };
    return { enabled: !!value.enabled, estimateDefault: value.estimate ?? "" };
  }

  return { enabled: config?.value === true, estimateDefault: "30-60 Minutes" };
}
