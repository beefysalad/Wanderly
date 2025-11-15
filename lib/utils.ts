import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts 24-hour time format (HH:mm) to 12-hour format with AM/PM
 * @param time24 - Time in 24-hour format (e.g., "14:30" or "09:00")
 * @returns Time in 12-hour format with AM/PM (e.g., "2:30 PM" or "9:00 AM")
 */
export function formatTime12Hour(time24: string): string {
  if (!time24) return "";
  
  const [hours, minutes] = time24.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return time24; // Return original if invalid format
  
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
}
