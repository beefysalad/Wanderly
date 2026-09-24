import { handleApiError } from "@/lib/handle-api-error";
import { NextResponse } from "next/server";
import { getUserCountService } from "./services";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getUserCountService());
  } catch (error) {
    return handleApiError(error);
  }
}
