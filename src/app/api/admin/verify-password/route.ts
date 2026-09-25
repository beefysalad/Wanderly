import { handleApiError } from "@/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { verifyPasswordSchema } from "./schemas";
import { verifyAdminPasswordService } from "./services";

export async function GET(req: NextRequest) {
  try {
    await verifyAdminPasswordService(
      req.headers.get("x-admin-password"),
      req.headers.get("user-agent"),
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { password } = verifyPasswordSchema.parse(await req.json());
    await verifyAdminPasswordService(password, req.headers.get("user-agent"));
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
