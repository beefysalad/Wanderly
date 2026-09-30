import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from "vitest";
import { logger } from "./logger";

type Sink = "log" | "warn" | "error" | "debug" | "info";
type ConsoleSpy = MockInstance<(...args: unknown[]) => void>;
type ConsoleSpies = Record<Sink, ConsoleSpy>;

function silence(sink: Sink): ConsoleSpy {
  return vi.spyOn(console, sink).mockImplementation(() => {});
}

function spyConsole(): ConsoleSpies {
  return {
    log: silence("log"),
    warn: silence("warn"),
    error: silence("error"),
    debug: silence("debug"),
    info: silence("info"),
  };
}

function lastEntry(spy: ConsoleSpy) {
  const call = spy.mock.calls.at(-1);
  if (!call) throw new Error("expected a log line");
  return JSON.parse(call[0] as string);
}

describe("logger in production", () => {
  let consoleSpy: ConsoleSpies;

  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    consoleSpy = spyConsole();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("serialises a top-level Error with its name, message and stack", () => {
    const error = new TypeError("boom");
    logger.error("Unhandled", error);

    const entry = lastEntry(consoleSpy.error);
    expect(entry).toMatchObject({ level: "error", message: "Unhandled" });
    expect(entry.data).toMatchObject({ name: "TypeError", message: "boom" });
    expect(entry.data.stack).toContain("boom");
  });

  it("serialises an Error nested under any property of the payload", () => {
    logger.error("Failed", {
      userId: "u1",
      error: new Error("emit failed"),
      rollbackError: new Error("rollback failed"),
    });

    const entry = lastEntry(consoleSpy.error);
    expect(entry.data.userId).toBe("u1");
    expect(entry.data.error).toMatchObject({ name: "Error", message: "emit failed" });
    expect(entry.data.rollbackError).toMatchObject({ message: "rollback failed" });
  });

  it("follows the cause chain", () => {
    const error = new Error("outer", { cause: new Error("inner") });
    logger.error("Failed", { error });

    const entry = lastEntry(consoleSpy.error);
    expect(entry.data.error.message).toBe("outer");
    expect(entry.data.error.cause).toMatchObject({ name: "Error", message: "inner" });
    expect(entry.data.error.cause.stack).toContain("inner");
  });

  it("keeps extra fields an error carries, such as a Prisma error code", () => {
    const error = Object.assign(new Error("Unique constraint failed"), {
      code: "P2002",
      meta: { target: ["email"] },
    });
    logger.error("Failed", error);

    const entry = lastEntry(consoleSpy.error);
    expect(entry.data).toMatchObject({
      message: "Unique constraint failed",
      code: "P2002",
      meta: { target: ["email"] },
    });
  });

  it("does not throw on a circular payload", () => {
    const error = new Error("loop") as Error & { self?: unknown };
    error.self = error;
    const payload: Record<string, unknown> = { error };
    payload.payload = payload;

    expect(() => logger.error("Circular", payload)).not.toThrow();
    const entry = lastEntry(consoleSpy.error);
    expect(entry.data.error.message).toBe("loop");
  });

  it("keeps a primitive payload such as a thrown string", () => {
    logger.error("Failed", "plain string");

    expect(lastEntry(consoleSpy.error).data).toBe("plain string");
  });

  it("routes each level to the matching console method", () => {
    logger.info("hello");
    logger.warn("careful");
    logger.error("broken");

    expect(lastEntry(consoleSpy.log)).toMatchObject({ level: "info", message: "hello" });
    expect(lastEntry(consoleSpy.warn)).toMatchObject({ level: "warn", message: "careful" });
    expect(lastEntry(consoleSpy.error)).toMatchObject({ level: "error", message: "broken" });
    expect(consoleSpy.log).toHaveBeenCalledTimes(1);
    expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
    expect(consoleSpy.error).toHaveBeenCalledTimes(1);
  });

  it("drops debug entries", () => {
    logger.debug("noisy", { detail: 1 });

    for (const spy of Object.values(consoleSpy)) {
      expect(spy).not.toHaveBeenCalled();
    }
  });
});

describe("logger outside production", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("emits debug entries in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    const consoleSpy = spyConsole();

    logger.debug("noisy", { detail: 1 });

    expect(consoleSpy.debug).toHaveBeenCalledWith(
      expect.stringContaining("noisy"),
      { detail: 1 },
    );
  });
});
