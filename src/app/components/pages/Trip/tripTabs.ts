export type TabType = "calendar" | "schedule" | "expenses" | "daily" | "budget";

// Tabs that can be selected through the `?tab=` query param ("daily" is the default).
export const URL_TABS: readonly TabType[] = ["expenses", "calendar", "schedule", "budget"];

export function parseTabParam(tab: string | null): TabType | null {
  return URL_TABS.find((candidate) => candidate === tab) ?? null;
}
