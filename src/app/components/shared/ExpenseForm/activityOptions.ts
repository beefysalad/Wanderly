import type { Activity } from "@/src/shared/types";
import { formatTime12Hour } from "@/lib/utils";

export function sortActivities(activities: Activity[]): Activity[] {
  return [...activities].sort((a, b) => {
    const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    const timeA = a.startTime || "00:00";
    const timeB = b.startTime || "00:00";
    return timeA.localeCompare(timeB);
  });
}

export function formatActivityDisplay(activity: Activity): string {
  const date = new Date(activity.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  if (activity.startTime) {
    return `${activity.title} - ${date} (${formatTime12Hour(activity.startTime)})`;
  }
  return `${activity.title} - ${date}`;
}
