import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { DecodedIdToken } from "firebase-admin/auth";
import { User } from "@prisma/client";
import { userAuth } from "../firebase-admin";

export interface AuthContext {
  uid: string;
  email?: string;
  emailVerified?: boolean;
  decodedToken: DecodedIdToken;
  user?: User;
}

/**
 * Higher-order function that wraps API route handlers with Firebase auth validation
 * @param handler - The API route handler function
 * @param options - Optional configuration for admin/role checks
 */
export function withAuth(
  handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>,
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // 1. Get the Authorization header
      const authHeader = req.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
      // 2. Extract the token
      const token = authHeader.split("Bearer ")[1];
      if (!token) {
        return NextResponse.json(
          { message: "No token provided" },
          { status: 401 },
        );
      }

      // 3. Verify the Firebase ID token
      if (!userAuth) {
        logger.error("Firebase Admin not initialized");
        return NextResponse.json(
          { message: "Authentication service unavailable" },
          { status: 503 },
        );
      }

      const decodedToken = await userAuth.verifyIdToken(token);

      // 4. Create auth context
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

      // 7. Call the original handler with auth context
      return await handler(req, authContext);
    } catch (error) {
      logger.error("Auth validation failed", error);

      // Handle specific Firebase auth errors
      if (error instanceof Error) {
        if (
          error.message.includes("token") ||
          error.message.includes("expired")
        ) {
          return NextResponse.json(
            { message: "Invalid or expired token" },
            { status: 401 },
          );
        }
        if (error.message.includes("revoked")) {
          return NextResponse.json(
            { message: "Token has been revoked" },
            { status: 401 },
          );
        }
      }

      return NextResponse.json(
        { message: "Authentication failed" },
        { status: 401 },
      );
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
export function withOptionalAuth(
  handler: (
    req: NextRequest,
    context: OptionalAuthContext,
  ) => Promise<NextResponse>,
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Try to authenticate as a regular user first
      const authHeader = req.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split("Bearer ")[1];
        if (token && userAuth) {
          try {
            const decodedToken = await userAuth.verifyIdToken(token);
            const authContext: OptionalAuthContext = {
              uid: decodedToken.uid,
              email: decodedToken.email,
              emailVerified: decodedToken.email_verified,
              decodedToken,
              isGuest: false,
            };
            return await handler(req, authContext);
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
        return await handler(req, guestContext);
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

// /**
//  * Version that requires admin access
//  */
// export function withAdminAuth(
//   handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>
// ) {
//   return withAuth(handler, { requireAdmin: true });
// }

// /**
//  * Version that requires specific admin roles
//  */
// export function withRoleAuth(
//   allowedRoles: string[],
//   handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>
// ) {
//   return withAuth(handler, { requireAdmin: true, allowedRoles });
// }
