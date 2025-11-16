import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { reviewsRateLimiter, getClientIP } from "@/lib/rate-limit";
import { createReviewService, listReviewsService } from "./services";
import { reviewsSchema } from "@/src/app/components/pages/Reviews/reviewsZod";

/**
 * GET /api/reviews
 * List all reviews with pagination and optional rating filter
 * Public route - no authentication required
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const ratingFilter = searchParams.get("rating")
      ? parseInt(searchParams.get("rating")!, 10)
      : undefined;

    // Validate pagination params
    // Allow higher limit for stats queries (up to 10000)
    if (page < 1 || limit < 1 || limit > 10000) {
      return NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 400 }
      );
    }

    // Validate rating filter if provided
    if (ratingFilter !== undefined && (ratingFilter < 1 || ratingFilter > 5)) {
      return NextResponse.json(
        { error: "Rating filter must be between 1 and 5" },
        { status: 400 }
      );
    }

    const result = await listReviewsService({
      page,
      limit,
      ratingFilter,
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error("Reviews GET API error", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/reviews
 * Create a new review
 * Public route - no authentication required, but rate limited
 */
export async function POST(req: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIP = getClientIP(req);

    // Check rate limit
    const rateLimitResult = reviewsRateLimiter.check(clientIP);
    if (!rateLimitResult.allowed) {
      logger.warn("Rate limit exceeded", {
        ip: clientIP,
        resetTime: new Date(rateLimitResult.resetTime).toISOString(),
      });
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          resetTime: rateLimitResult.resetTime,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "3",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
            "Retry-After": Math.ceil(
              (rateLimitResult.resetTime - Date.now()) / 1000
            ).toString(),
          },
        }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = reviewsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Create review
    const review = await createReviewService({
      rating: data.rating,
      comment: data.comment,
      name: data.name,
      email: data.email,
    });

    logger.info("Review created via API", {
      reviewId: review.id,
      rating: review.rating,
      ip: clientIP,
    });

    return NextResponse.json(
      { review },
      {
        status: 201,
        headers: {
          "X-RateLimit-Limit": "3",
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
        },
      }
    );
  } catch (error) {
    logger.error("Reviews POST API error", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

