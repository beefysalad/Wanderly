import { getAuth } from "firebase/auth";
import packageJson from "@/package.json";

const APP_VERSION = packageJson.version;

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
