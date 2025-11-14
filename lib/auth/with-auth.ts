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
  handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>
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
          { status: 401 }
        );
      }

      // 3. Verify the Firebase ID token
      if (!userAuth) {
        logger.error("Firebase Admin not initialized");
        return NextResponse.json(
          { message: "Authentication service unavailable" },
          { status: 503 }
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
            { status: 401 }
          );
        }
        if (error.message.includes("revoked")) {
          return NextResponse.json(
            { message: "Token has been revoked" },
            { status: 401 }
          );
        }
      }

      return NextResponse.json(
        { message: "Authentication failed" },
        { status: 401 }
      );
    }
  };
}

export function withBasicAuth(
  handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>
) {
  return withAuth(handler);
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
