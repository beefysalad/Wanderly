import { handleApiError } from "@/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { auditAdminAction } from "../../admin/audit";
import { assertAdmin } from "../../admin/guard";
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
    const { adminEmail } = await assertAdmin(req);

    const body = whatsNewConfigSchema.parse(await req.json());
    auditAdminAction(adminEmail, "update-whats-new", { version: body.version });
    const config = await updateWhatsNewConfigService(body);
    return NextResponse.json({ success: true, config });
  } catch (error) {
    return handleApiError(error);
  }
}
