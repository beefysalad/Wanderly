import { getAuth } from "firebase/auth";

const APP_VERSION = "1.0.0";

export function getEnvironment() {
  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT;
  return environment === "DEV" ? "Development" : "Production";
}

export function isDev() {
  return getEnvironment() === "Development";
}

export function getAppVersion() {
  return `v${APP_VERSION}`;
}

export function getToken() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated");
  }
  return user.getIdToken();
}
export function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
export function getStatusBadge(status?: string) {
  switch (status) {
    case "planning":
      return {
        bg: "bg-blue-100",
        text: "text-blue-700",
        border: "border-blue-200",
        label: "Planning",
      };
    case "finalized":
      return {
        bg: "bg-green-100",
        text: "text-green-700",
        border: "border-green-200",
        label: "Finalized",
      };
    case "ongoing":
      return {
        bg: "bg-amber-100",
        text: "text-amber-700",
        border: "border-amber-200",
        label: "Ongoing",
      };
    case "cancelled":
      return {
        bg: "bg-red-100",
        text: "text-red-700",
        border: "border-red-200",
        label: "Cancelled",
      };
    default:
      return {
        bg: "bg-slate-100",
        text: "text-slate-700",
        border: "border-slate-200",
        label: "Planning",
      };
  }
}
