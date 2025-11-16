/**
 * Simple in-memory rate limiter for public API routes
 * Tracks requests per IP address with configurable limits
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    private maxRequests: number = 3,
    private windowMs: number = 60 * 60 * 1000 // 1 hour default
  ) {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Check if a request from the given IP should be allowed
   * @param ip - IP address of the requester
   * @returns Object with allowed status, remaining requests, and reset time
   */
  check(ip: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const entry = this.store.get(ip);

    if (!entry || now > entry.resetTime) {
      // No entry or expired, create new window
      const resetTime = now + this.windowMs;
      this.store.set(ip, {
        count: 1,
        resetTime,
      });
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime,
      };
    }

    // Entry exists and is valid
    if (entry.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    // Increment count
    entry.count++;
    this.store.set(ip, entry);

    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Remove expired entries from the store
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [ip, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(ip);
      }
    }
  }

  /**
   * Manually clean up (useful for testing or manual cleanup)
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Create a singleton instance for reviews (10 requests per hour)
export const reviewsRateLimiter = new RateLimiter(10, 60 * 60 * 1000);

/**
 * Get client IP address from request
 * Handles various proxy headers (X-Forwarded-For, X-Real-IP)
 */
export function getClientIP(request: Request): string {
  // Check X-Forwarded-For header (first IP in chain)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const ips = forwardedFor.split(",").map((ip) => ip.trim());
    return ips[0] || "unknown";
  }

  // Check X-Real-IP header
  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Fallback (shouldn't happen in production with proper proxy)
  return "unknown";
}
