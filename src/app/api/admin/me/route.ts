import { handleApiError } from "@/src/lib/handle-api-error";
import { withRateLimit } from "@/src/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "../guard";

/** Lets the admin UI ask "am I an admin?" after a Firebase sign-in. */
async function handler(req: NextRequest) {
  try {
    const { adminEmail } = await assertAdmin(req);
    return NextResponse.json({ email: adminEmail });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withRateLimit("admin-signin", handler);
