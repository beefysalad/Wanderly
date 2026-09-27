import { NextResponse } from "next/server";
import { getHealthService } from "./services";

export async function GET() {
  const health = await getHealthService();
  return NextResponse.json(health, { status: health.status === "ok" ? 200 : 503 });
}
