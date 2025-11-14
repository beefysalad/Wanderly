// src/lib/logger.ts
type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: unknown;
}

class Logger {
  private log(level: LogLevel, message: string, data?: unknown) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(data && typeof data === "object" ? { data } : {}),
    };

    if (process.env.NODE_ENV === "development") {
      console[level](`[${entry.timestamp}] ${message}`, data || "");
    } else {
      console.log(JSON.stringify(entry));
    }
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
