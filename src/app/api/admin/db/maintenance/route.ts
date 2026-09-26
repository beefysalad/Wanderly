import { handleApiError } from "@/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { auditAdminAction } from "../../audit";
import { assertAdmin } from "../../guard";
import { maintenanceSchema } from "../schemas";
import { cleanTestDataService } from "../services";

export async function POST(req: NextRequest) {
  try {
    const { adminEmail } = await assertAdmin(req);
    const { action } = maintenanceSchema.parse(await req.json());
    auditAdminAction(adminEmail, `maintenance:${action}`);

    switch (action) {
      case "clean-test-data":
        return NextResponse.json(await cleanTestDataService());
    }
  } catch (error) {
    return handleApiError(error);
  }
}
