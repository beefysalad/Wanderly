import { handleApiError } from "@/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "../../guard";
import { maintenanceSchema } from "../schemas";
import { cleanTestDataService } from "../services";

export async function POST(req: NextRequest) {
  try {
    await assertAdmin(req);
    const { action } = maintenanceSchema.parse(await req.json());

    switch (action) {
      case "clean-test-data":
        return NextResponse.json(await cleanTestDataService());
    }
  } catch (error) {
    return handleApiError(error);
  }
}
