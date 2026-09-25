import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { handleApiError } from "@/lib/handle-api-error";
import { DecodedIdToken } from "firebase-admin/auth";
import { User } from "@prisma/client";
import { userAuth } from "../firebase-admin";

/**
 * Reject tokens of revoked or disabled accounts immediately instead of when the token expires
 * (~1h). Costs one extra Firebase lookup per request; flip to false to fall back to local
 * signature/expiry verification only.
 */
const CHECK_REVOKED = true;

export interface AuthContext {
  uid: string;
  email?: string;
  emailVerified?: boolean;
  decodedToken: DecodedIdToken;
  user?: User;
}

export interface RouteContext<
  Params extends Record<string, string> = Record<string, string>,
> {
  params: Promise<Params>;
}

function authErrorResponse(error: unknown): NextResponse {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";

  if (code === "auth/id-token-revoked" || code === "auth/user-disabled") {
    return NextResponse.json({ message: "Token has been revoked" }, { status: 401 });
  }
  if (code === "auth/id-token-expired" || (error instanceof Error && /token/i.test(error.message))) {
    return NextResponse.json({ message: "Invalid or expired token" }, { status: 401 });
  }
  return NextResponse.json({ message: "Authentication failed" }, { status: 401 });
}

/**
 * Higher-order function that wraps API route handlers with Firebase auth validation.
 * Authentication failures are 401s; anything the handler itself throws is mapped by
 * handleApiError (so a database error is a 500, not a 401).
 */
export function withAuth<
  Params extends Record<string, string> = Record<string, string>,
>(
  handler: (
    req: NextRequest,
    context: AuthContext,
    routeContext: RouteContext<Params>,
  ) => Promise<NextResponse>,
) {
  return async (
    req: NextRequest,
    routeContext?: RouteContext<Params>,
  ): Promise<NextResponse> => {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    if (!token) {
      return NextResponse.json({ message: "No token provided" }, { status: 401 });
    }

    if (!userAuth) {
      logger.error("Firebase Admin not initialized");
      return NextResponse.json(
        { message: "Authentication service unavailable" },
        { status: 503 },
      );
    }

    let decodedToken: DecodedIdToken;
    try {
      decodedToken = await userAuth.verifyIdToken(token, CHECK_REVOKED);
    } catch (error) {
      logger.warn("Auth validation failed", { error });
      return authErrorResponse(error);
    }

    const authContext: AuthContext = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      decodedToken,
    };

    logger.info("Auth validation successful", {
      uid: decodedToken.uid,
      path: req.nextUrl.pathname,
    });

    try {
      return await handler(req, authContext, routeContext as RouteContext<Params>);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

export function withBasicAuth(
  handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>,
) {
  return withAuth(handler);
}

export interface OptionalAuthContext extends AuthContext {
  isGuest: boolean;
  groupCode?: string;
}

/**
 * Higher-order function that wraps API route handlers with optional auth validation
 * Allows both authenticated users and guests (with group code)
 * @param handler - The API route handler function
 */
export function withOptionalAuth<
  Params extends Record<string, string> = Record<string, string>,
>(
  handler: (
    req: NextRequest,
    context: OptionalAuthContext,
    routeContext: RouteContext<Params>,
  ) => Promise<NextResponse>,
) {
  return async (
    req: NextRequest,
    routeContext?: RouteContext<Params>,
  ): Promise<NextResponse> => {
    try {
      // Try to authenticate as a regular user first
      const authHeader = req.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split("Bearer ")[1];
        if (token && userAuth) {
          try {
            const decodedToken = await userAuth.verifyIdToken(token, CHECK_REVOKED);
            const authContext: OptionalAuthContext = {
              uid: decodedToken.uid,
              email: decodedToken.email,
              emailVerified: decodedToken.email_verified,
              decodedToken,
              isGuest: false,
            };
            return await handler(req, authContext, routeContext as RouteContext<Params>);
          } catch (_error) {
            // Token invalid, fall through to guest check
            logger.warn("Token validation failed, checking for guest access", {
              error: _error,
            });
          }
        }
      }

      // If no valid auth token, check for guest access
      const groupCode = req.headers.get("X-Guest-Code");
      if (groupCode) {
        const guestContext: OptionalAuthContext = {
          uid: "guest",
          isGuest: true,
          groupCode,
          decodedToken: {} as DecodedIdToken,
        };
        return await handler(req, guestContext, routeContext as RouteContext<Params>);
      }

      // Neither authenticated nor guest
      return NextResponse.json(
        { message: "Unauthorized - Authentication or guest code required" },
        { status: 401 },
      );
    } catch (error) {
      logger.error("Optional auth validation failed", error);
      return NextResponse.json(
        { message: "Authentication failed" },
        { status: 401 },
      );
    }
  };
}
