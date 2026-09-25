import { describe, expect, it } from "vitest";
import { securityHeaders } from "./security-headers";

const byKey = (headers: { key: string; value: string }[]) =>
  Object.fromEntries(headers.map((h) => [h.key, h.value]));

describe("securityHeaders", () => {
  it("sets the baseline hardening headers", () => {
    const h = byKey(securityHeaders());

    expect(h["X-Content-Type-Options"]).toBe("nosniff");
    expect(h["X-Frame-Options"]).toBe("DENY");
    expect(h["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["Strict-Transport-Security"]).toContain("max-age=");
    expect(h["Permissions-Policy"]).toContain("camera=()");
  });

  it("ships the CSP as report-only so nothing breaks while it is tuned", () => {
    const h = byKey(securityHeaders());

    expect(h["Content-Security-Policy-Report-Only"]).toBeDefined();
    expect(h["Content-Security-Policy"]).toBeUndefined();
  });

  it("allows Cloudinary images and forbids framing and plugins", () => {
    const csp = byKey(securityHeaders())["Content-Security-Policy-Report-Only"];

    expect(csp).toContain("img-src 'self' data: blob: https://res.cloudinary.com");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
  });

  it("adds the socket origin to connect-src when configured", () => {
    const csp = byKey(securityHeaders({ socketUrl: "https://socket.example.com" }))[
      "Content-Security-Policy-Report-Only"
    ];

    expect(csp).toContain("https://socket.example.com");
    expect(csp).toContain("wss://socket.example.com");
  });
});
