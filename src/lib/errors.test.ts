import { describe, expect, it } from "vitest";
import {
  AppError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "./errors";

describe("AppError", () => {
  it("carries a message and status", () => {
    const err = new AppError("custom", 418);
    expect(err.message).toBe("custom");
    expect(err.status).toBe(418);
    expect(err).toBeInstanceOf(Error);
  });
});

describe("NotFoundError", () => {
  it("defaults to 404 with a generic message", () => {
    const err = new NotFoundError();
    expect(err.status).toBe(404);
    expect(err.message).toBe("Not found");
  });

  it("accepts a custom message", () => {
    const err = new NotFoundError("Trip not found");
    expect(err.message).toBe("Trip not found");
    expect(err.status).toBe(404);
  });
});

describe("ForbiddenError", () => {
  it("defaults to 403", () => {
    expect(new ForbiddenError().status).toBe(403);
  });
});

describe("ValidationError", () => {
  it("defaults to 400", () => {
    expect(new ValidationError().status).toBe(400);
  });
});

describe("UnauthorizedError", () => {
  it("defaults to 401", () => {
    expect(new UnauthorizedError().status).toBe(401);
  });

  it("accepts a custom message", () => {
    const err = new UnauthorizedError("Incorrect current password");
    expect(err.message).toBe("Incorrect current password");
    expect(err.status).toBe(401);
  });
});
