import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

// Browsers can send fairly large reports; anything past this is dropped rather than parsed.
const MAX_REPORT_BYTES = 10 * 1024;

/**
 * Sink for `report-uri` violations from the report-only CSP (`lib/security-headers.ts`).
 * Logged only — nothing here is persisted or acted on automatically. Once these have been
 * reviewed for false positives, the header can switch from Report-Only to enforced.
 */
async function postHandler(req: NextRequest) {
  const contentLength = Number(req.headers.get("content-length"));
  if (contentLength > MAX_REPORT_BYTES) {
    return new NextResponse(null, { status: 413 });
  }

  try {
    const report: unknown = await req.json();
    logger.warn("CSP violation report", { report });
  } catch (error) {
    logger.warn("Received an unparseable CSP report", { error });
  }

  return new NextResponse(null, { status: 204 });
}

export const POST = withRateLimit("csp-report", postHandler);
