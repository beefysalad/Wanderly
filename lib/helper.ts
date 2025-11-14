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
