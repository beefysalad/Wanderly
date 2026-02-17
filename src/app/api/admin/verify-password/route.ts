import { verifyAdminPassword } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const password = req.headers.get("x-admin-password");
    const isValid = await verifyAdminPassword(password);

    if (!isValid) {
      logger.warn("Admin: Failed password verification attempt", { 
        hasPassword: !!password,
        ua: req.headers.get("user-agent") 
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Admin: Error in verify-password route", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const isValid = await verifyAdminPassword(password);

    if (!isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
