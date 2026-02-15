import { AuthContext, withAuth } from "@/lib/auth/with-auth";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

async function handler(req: NextRequest, auth: AuthContext) {
  try {
    if (req.method !== "PATCH") {
      return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 },
      );
    }

    const body = await req.json();
    const { lastSeenWhatsNew } = body;

    const updatedUser = await prisma.user.upsert({
      where: { firebaseId: auth.uid },
      update: {
        ...(lastSeenWhatsNew !== undefined && { lastSeenWhatsNew }),
      },
      create: {
        firebaseId: auth.uid,
        email: auth.email || "",
        name: auth.decodedToken.name || auth.email?.split("@")[0] || "User",
        lastSeenWhatsNew: lastSeenWhatsNew || "",
      },
    });

    logger.info("User profile updated", {
      userId: auth.uid,
      fields: Object.keys(body),
    });

    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (error) {
    logger.error("User profile update error", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export const PATCH = withAuth(handler);
