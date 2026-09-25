interface HeaderEnv {
  socketUrl?: string;
}

function socketSources(socketUrl?: string): string[] {
  if (!socketUrl) return [];
  try {
    const { protocol, host } = new URL(socketUrl);
    const ws = protocol === "https:" ? "wss:" : "ws:";
    return [`${protocol}//${host}`, `${ws}//${host}`];
  } catch {
    return [];
  }
}

/**
 * Content-Security-Policy in REPORT-ONLY mode: violations show up in the browser console but
 * nothing is blocked. Switch the header name to Content-Security-Policy once it is quiet.
 */
function contentSecurityPolicy(env: HeaderEnv): string {
  const connect = [
    "'self'",
    "https://*.googleapis.com",
    "https://*.firebaseio.com",
    "wss://*.firebaseio.com",
    ...socketSources(env.socketUrl),
  ];

  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com",
    `connect-src ${connect.join(" ")}`,
    "frame-src https://*.firebaseapp.com https://accounts.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

export function securityHeaders(
  env: HeaderEnv = { socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL },
): { key: string; value: string }[] {
  return [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
    { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy(env) },
  ];
}
