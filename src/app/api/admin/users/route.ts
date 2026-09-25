import { handleApiError } from "@/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "../guard";
import { listUsersService } from "./services";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await assertAdmin(req);
    return NextResponse.json(await listUsersService());
  } catch (error) {
    return handleApiError(error);
  }
}
