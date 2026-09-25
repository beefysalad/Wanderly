import { withAuth, type AuthContext } from "@/lib/auth/with-auth";
import { ValidationError } from "@/lib/errors";
import { handleApiError } from "@/lib/handle-api-error";
import { NextRequest, NextResponse } from "next/server";
import { uploadFolderSchema } from "./schemas";
import { uploadImageService } from "./services";

async function postHandler(req: NextRequest, context: AuthContext) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new ValidationError("No file provided");
    }

    const folder = uploadFolderSchema.parse(formData.get("folder") || undefined);

    const result = await uploadImageService(file, folder, context.user?.id);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withAuth(postHandler);
