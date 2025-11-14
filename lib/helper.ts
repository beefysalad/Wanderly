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
