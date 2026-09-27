import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from "vitest";
import { z } from "zod";
import { NotFoundError } from "./errors";
import { handleApiError } from "./handle-api-error";

let consoleError: MockInstance<(...args: unknown[]) => void>;

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("handleApiError", () => {
  it("maps a ZodError to 400 with issues", async () => {
    const schema = z.object({ name: z.string() });
    const result = schema.safeParse({ name: 123 });
    if (result.success) throw new Error("expected parse failure");

    const response = handleApiError(result.error);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid request");
    expect(body.issues).toBeDefined();
  });

  it("maps an AppError subclass to its own status and message", async () => {
    const response = handleApiError(new NotFoundError("Trip not found"));
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Trip not found");
  });

  it("maps an unknown error to a generic 500 without leaking the message", async () => {
    const response = handleApiError(new Error("db connection string leaked here"));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Internal server error");
    expect(JSON.stringify(body)).not.toContain("leaked");
  });

  it("logs the unhandled error's message and stack for the operator", () => {
    handleApiError(new Error("db connection string leaked here"));

    expect(consoleError).toHaveBeenCalledTimes(1);
    const entry = JSON.parse(consoleError.mock.calls[0][0] as string);
    expect(entry.message).toBe("Unhandled API error");
    expect(entry.data.message).toBe("db connection string leaked here");
    expect(entry.data.stack).toContain("db connection string leaked here");
  });

  it("maps a malformed-JSON body error to 400 instead of a 500, without logging it as unhandled", async () => {
    let jsonError: unknown;
    try {
      JSON.parse("{not valid json");
    } catch (error) {
      jsonError = error;
    }

    const response = handleApiError(jsonError);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid JSON body");
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("does not treat an unrelated SyntaxError as a client error", async () => {
    const response = handleApiError(new SyntaxError("Invalid regular expression: /(/"));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Internal server error");
  });
});
