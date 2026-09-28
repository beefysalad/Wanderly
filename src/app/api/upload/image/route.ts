import { withAuth, type AuthContext } from "@/lib/auth/with-auth";
import { ValidationError } from "@/lib/errors";
import { handleApiError } from "@/lib/handle-api-error";
import { withRateLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { MAX_IMAGE_BYTES, uploadFolderSchema } from "./schemas";
import { uploadImageService } from "./services";

// Multipart form overhead (boundary, field names) on top of the file itself.
const CONTENT_LENGTH_MARGIN_BYTES = 10 * 1024;

async function postHandler(req: NextRequest, context: AuthContext) {
  try {
    const contentLength = Number(req.headers.get("content-length"));
    if (contentLength > MAX_IMAGE_BYTES + CONTENT_LENGTH_MARGIN_BYTES) {
      throw new ValidationError("File size must be less than 5MB");
    }

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

export const POST = withAuth(
  withRateLimit("upload", postHandler, {
    key: (_req, context: AuthContext) => context.uid,
  }),
);
