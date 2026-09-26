import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockLimit = vi.fn();
const constructed = vi.fn();

vi.mock("@upstash/redis", () => ({ Redis: class {} }));
vi.mock("@upstash/ratelimit", () => {
  class Ratelimit {
    constructor(options: unknown) {
      constructed(options);
    }
    limit = (...a: unknown[]) => mockLimit(...a);
    static slidingWindow = (requests: number, window: string) => ({ requests, window });
  }
  return { Ratelimit };
});
vi.mock("./logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

const importFresh = async () => {
  vi.resetModules();
  return import("./rate-limit");
};

const req = (headers: Record<string, string> = {}) =>
  new NextRequest("http://localhost/api/x", { method: "POST", headers });

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
});

describe("limit", () => {
  it("fails open without touching Redis when the env vars are unset", async () => {
    const { limit } = await importFresh();

    const result = await limit("validate-code", "1.2.3.4");

    expect(result.allowed).toBe(true);
    expect(constructed).not.toHaveBeenCalled();
  });

  describe("with Redis configured", () => {
    beforeEach(() => {
      process.env.UPSTASH_REDIS_REST_URL = "https://redis.example.com";
      process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    });

    it("blocks when the sliding window is exhausted", async () => {
      mockLimit.mockResolvedValue({ success: false, remaining: 0, reset: 1234 });
      const { limit } = await importFresh();

      expect(await limit("validate-code", "1.2.3.4")).toEqual({
        allowed: false,
        remaining: 0,
        resetTime: 1234,
      });
      expect(mockLimit).toHaveBeenCalledWith("1.2.3.4");
    });

    it("configures each limiter with its own window and prefix", async () => {
      mockLimit.mockResolvedValue({ success: true, remaining: 9, reset: 1 });
      const { limit } = await importFresh();

      await limit("validate-code", "k");
      await limit("reviews", "k");

      expect(constructed).toHaveBeenCalledWith(
        expect.objectContaining({
          limiter: { requests: 10, window: "1 m" },
          prefix: "wanderly:validate-code",
        }),
      );
      expect(constructed).toHaveBeenCalledWith(
        expect.objectContaining({
          limiter: { requests: 10, window: "1 h" },
          prefix: "wanderly:reviews",
        }),
      );
    });

    it("fails open when Redis errors", async () => {
      mockLimit.mockRejectedValue(new Error("redis down"));
      const { limit } = await importFresh();

      expect((await limit("guest-join", "k")).allowed).toBe(true);
    });
  });
});

describe("getClientIP", () => {
  it("uses the first x-forwarded-for hop, then x-real-ip, then 'unknown'", async () => {
    const { getClientIP } = await importFresh();

    expect(getClientIP(req({ "x-forwarded-for": "9.9.9.9, 10.0.0.1" }))).toBe("9.9.9.9");
    expect(getClientIP(req({ "x-real-ip": "8.8.8.8" }))).toBe("8.8.8.8");
    expect(getClientIP(req())).toBe("unknown");
  });
});

describe("withRateLimit", () => {
  beforeEach(() => {
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.example.com";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
  });

  it("returns 429 with Retry-After and skips the handler when blocked", async () => {
    mockLimit.mockResolvedValue({ success: false, remaining: 0, reset: Date.now() + 30_000 });
    const { withRateLimit } = await importFresh();
    const handler = vi.fn();

    const response = await withRateLimit("validate-code", handler)(
      req({ "x-forwarded-for": "1.1.1.1" }),
    );

    expect(response.status).toBe(429);
    expect(Number(response.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(handler).not.toHaveBeenCalled();
  });

  it("passes the request and extra arguments through when allowed", async () => {
    mockLimit.mockResolvedValue({ success: true, remaining: 5, reset: Date.now() + 1000 });
    const { withRateLimit } = await importFresh();
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const extra = { params: Promise.resolve({}) };

    const response = await withRateLimit("validate-code", handler)(req(), extra);

    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledWith(expect.anything(), extra);
  });
});
