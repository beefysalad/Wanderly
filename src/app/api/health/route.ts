import { withRateLimit } from "@/src/lib/rate-limit";
import { NextResponse } from "next/server";
import { getHealthService } from "./services";

async function handler() {
  const health = await getHealthService();
  return NextResponse.json(health, { status: health.status === "ok" ? 200 : 503 });
}

// Public and hits the database on every call, so it is rate limited like other public routes.
export const GET = withRateLimit("health", handler);
