import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { NotFoundError } from "./errors";
import { handleApiError } from "./handle-api-error";

vi.mock("./logger", () => ({
  logger: { error: vi.fn() },
}));

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

    const { logger } = await import("./logger");
    expect(logger.error).toHaveBeenCalled();
  });
});
