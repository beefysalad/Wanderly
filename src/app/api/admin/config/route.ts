import { handleApiError } from "@/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "../guard";
import { upsertConfigSchema } from "./schemas";
import { listConfigsService, upsertConfigService } from "./services";

export async function GET(req: NextRequest) {
  try {
    await assertAdmin(req);
    return NextResponse.json({ configs: await listConfigsService() });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await assertAdmin(req);
    const body = upsertConfigSchema.parse(await req.json());
    return NextResponse.json({ success: true, config: await upsertConfigService(body) });
  } catch (error) {
    return handleApiError(error);
  }
}
