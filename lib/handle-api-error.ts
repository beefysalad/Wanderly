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

  logger.error("Unhandled API error", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
