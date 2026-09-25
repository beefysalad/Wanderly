import { handleApiError } from "@/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "../../guard";
import { getDbStatsService } from "../services";

export async function GET(req: NextRequest) {
  try {
    await assertAdmin(req);
    return NextResponse.json(await getDbStatsService());
  } catch (error) {
    return handleApiError(error);
  }
}
