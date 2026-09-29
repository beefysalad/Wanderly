type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: unknown;
}

interface SerializedError {
  name: string;
  message: string;
  stack?: string;
  cause?: unknown;
  [extra: string]: unknown;
}

const CIRCULAR = "[Circular]";

function isPlainObject(value: object): value is Record<string, unknown> {
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Makes `data` safe for `JSON.stringify`: `Error` values (at any depth, and
 * along their `cause` chain) become `{ name, message, stack, cause }` plus any
 * enumerable fields they carry (e.g. a Prisma error's `code`/`meta`), since
 * `JSON.stringify(new Error("x"))` is `"{}"`. Circular references become
 * `"[Circular]"`. Other non-plain objects (Date, etc.) are left to their own
 * `toJSON`.
 */
function toLoggable(value: unknown, ancestors: WeakSet<object> = new WeakSet()): unknown {
  if (value === null || typeof value !== "object") return value;
  if (ancestors.has(value)) return CIRCULAR;

  const isError = value instanceof Error;
  if (!isError && !Array.isArray(value) && !isPlainObject(value)) return value;

  ancestors.add(value);
  try {
    if (Array.isArray(value)) return value.map((item) => toLoggable(item, ancestors));

    const fields: Record<string, unknown> = {};
    for (const [key, field] of Object.entries(value)) {
      fields[key] = toLoggable(field, ancestors);
    }
    if (!isError) return fields;

    const serialized: SerializedError = {
      ...fields,
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
    if (value.cause !== undefined) serialized.cause = toLoggable(value.cause, ancestors);
    return serialized;
  } finally {
    ancestors.delete(value);
  }
}

/**
 * Development: human-readable line via `console[level]`, `data` passed through
 * untouched so the dev console renders errors natively.
 *
 * Any other NODE_ENV (production, test): one JSON line per entry; `error` goes
 * to `console.error`, `warn` to `console.warn`, `info` to `console.log`.
 *
 * `debug` is emitted only when NODE_ENV is not "production".
 */
class Logger {
  private log(level: LogLevel, message: string, data?: unknown) {
    const env = process.env.NODE_ENV;
    if (level === "debug" && env === "production") return;

    const timestamp = new Date().toISOString();

    if (env === "development") {
      console[level](`[${timestamp}] ${message}`, data ?? "");
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp,
      ...(data !== undefined ? { data: toLoggable(data) } : {}),
    };
    const line = JSON.stringify(entry);

    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
  }

  info(message: string, data?: unknown) {
    this.log("info", message, data);
  }

  warn(message: string, data?: unknown) {
    this.log("warn", message, data);
  }

  error(message: string, data?: unknown) {
    this.log("error", message, data);
  }

  debug(message: string, data?: unknown) {
    this.log("debug", message, data);
  }
}

export const logger = new Logger();
