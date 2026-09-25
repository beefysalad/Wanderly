import { UnauthorizedError } from "@/lib/errors";
import { handleApiError } from "@/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { whatsNewConfigSchema } from "./schemas";
import { getWhatsNewConfigService, updateWhatsNewConfigService } from "./services";

export async function GET() {
  try {
    return NextResponse.json(await getWhatsNewConfigService());
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    // NOTE: shared-password gate kept as-is; replacing it is the security pass's job.
    const adminPassword = req.headers.get("x-admin-password");
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      throw new UnauthorizedError("Unauthorized");
    }

    const body = whatsNewConfigSchema.parse(await req.json());
    const config = await updateWhatsNewConfigService(body);
    return NextResponse.json({ success: true, config });
  } catch (error) {
    return handleApiError(error);
  }
}
