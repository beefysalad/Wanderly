import { handleApiError } from "@/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "../../guard";
import { deleteUserService } from "../services";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await assertAdmin(req);
    const { id } = await params;
    return NextResponse.json(await deleteUserService(id));
  } catch (error) {
    return handleApiError(error);
  }
}
