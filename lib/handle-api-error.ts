import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { AppError } from "./errors";
import { logger } from "./logger";

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Invalid request", issues: z.flattenError(error) },
      { status: 400 },
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  // `await req.json()` throws a SyntaxError for a malformed body. That is a
  // client mistake, not a server fault. Match on the message so an unrelated
  // SyntaxError from our own code still surfaces as a 500.
  if (error instanceof SyntaxError && /json/i.test(error.message)) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  logger.error("Unhandled API error", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
