import { NextRequest, NextResponse } from "next/server";
import { gatewayRateLimiter, getClientIP } from "@/lib/rate-limit";

/**
 * API Gateway Route
 * This route acts as a single entry point for all API requests in production.
 * It reads the intended target from the 'X-Api-Target' header and proxies the request.
 */
export async function POST(req: NextRequest) {
  try {
    // Rate Limiting
    const ip = getClientIP(req);
    const { allowed, remaining, resetTime } = gatewayRateLimiter.check(ip);

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests", details: "Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "100",
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": resetTime.toString(),
          },
        },
      );
    }

    const targetPath = req.headers.get("X-Api-Target");

    if (!targetPath) {
      return NextResponse.json(
        { error: "No target specified" },
        { status: 400 },
      );
    }

    // Security check: ensure the target is within /api
    if (!targetPath.startsWith("/api/")) {
      return NextResponse.json({ error: "Invalid target" }, { status: 403 });
    }

    // Extract original request details
    const method = req.method;
    const body = await req.json().catch(() => null);
    const headers = new Headers(req.headers);

    // Remove the gateway-specific header before forwarding
    headers.delete("X-Api-Target");
    headers.delete("host"); // Let the internal fetch handle the host

    // Resolve the internal URL (absolute URL for the internal API)
    const baseUrl = req.nextUrl.origin;
    const internalUrl = `${baseUrl}${targetPath}`;

    // Proxy the request to the actual endpoint
    const response = await fetch(internalUrl, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Handle the response
    const data = await response.json().catch(() => null);

    // Filter headers to avoid conflicts with the outer response implementation
    const responseHeaders = new Headers();
    const headersToSkip = ["content-encoding", "transfer-encoding", "content-length"];
    
    response.headers.forEach((value, key) => {
      if (!headersToSkip.includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    // Return the response from the actual endpoint
    return NextResponse.json(data, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Gateway error:", error);
    return NextResponse.json(
      { error: "Internal Gateway Error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

// Support other methods if needed, though POST is often used for all "obfuscated" calls
export const GET = POST;
export const PUT = POST;
export const DELETE = POST;
export const PATCH = POST;
