const UNITS = ["Bytes", "KB", "MB", "GB", "TB"];

/** Human-readable byte size, e.g. `formatBytes(1536)` -> `"1.5 KB"`. */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + UNITS[i];
}
