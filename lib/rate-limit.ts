import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "./logger";

const LIMITERS = {
  "validate-code": { requests: 10, window: "1 m" },
  "guest-join": { requests: 20, window: "1 m" },
  reviews: { requests: 10, window: "1 h" },
  "admin-signin": { requests: 10, window: "10 m" },
} as const;

export type LimiterName = keyof typeof LIMITERS;

export interface LimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

const OPEN: LimitResult = { allowed: true, remaining: Number.MAX_SAFE_INTEGER, resetTime: 0 };

let redis: Redis | null | undefined;
const limiters = new Map<LimiterName, Ratelimit>();

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  redis = url && token ? new Redis({ url, token }) : null;
  if (!redis) {
    logger.warn("Rate limiting disabled: UPSTASH_REDIS_REST_URL/TOKEN are not set");
  }
  return redis;
}

function getLimiter(name: LimiterName): Ratelimit | null {
  const existing = limiters.get(name);
  if (existing) return existing;

  const client = getRedis();
  if (!client) return null;

  const { requests, window } = LIMITERS[name];
  const limiter = new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix: `wanderly:${name}`,
  });
  limiters.set(name, limiter);
  return limiter;
}

/**
 * Counts one attempt for `key` against the named limiter. Fails OPEN (allows the request and
 * logs) if Redis is not configured or errors: an outage of the limiter must not take the app down.
 */
export async function limit(name: LimiterName, key: string): Promise<LimitResult> {
  const limiter = getLimiter(name);
  if (!limiter) return OPEN;

  try {
    const result = await limiter.limit(key);
    return { allowed: result.success, remaining: result.remaining, resetTime: result.reset };
  } catch (error) {
    logger.error("Rate limiter failed, allowing request", { name, error });
    return OPEN;
  }
}

/**
 * Get client IP address from request. x-forwarded-for is set by the hosting proxy (Vercel);
 * behind an untrusted proxy it can be spoofed.
 */
export function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const ips = forwardedFor.split(",").map((ip) => ip.trim());
    return ips[0] || "unknown";
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  return "unknown";
}

/** Wraps a route handler so requests over the named limit get a 429 before the handler runs. */
export function withRateLimit<A extends unknown[]>(
  name: LimiterName,
  handler: (req: NextRequest, ...rest: A) => Promise<NextResponse>,
) {
  return async (req: NextRequest, ...rest: A): Promise<NextResponse> => {
    const ip = getClientIP(req);
    const result = await limit(name, ip);

    if (!result.allowed) {
      logger.warn("Rate limit exceeded", { name, ip });
      const retryAfter = Math.max(1, Math.ceil((result.resetTime - Date.now()) / 1000));
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          resetTime: result.resetTime,
        },
        { status: 429, headers: { "Retry-After": retryAfter.toString() } },
      );
    }

    return handler(req, ...rest);
  };
}
