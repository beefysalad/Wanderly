import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { reviewsRateLimiter, getClientIP } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/handle-api-error";
import { createReviewService, listReviewsService } from "./services";
import { listReviewsQuerySchema } from "./schemas";
import { reviewsSchema } from "@/src/app/components/pages/Reviews/reviewsZod";

/**
 * GET /api/reviews
 * List all reviews with pagination and optional rating filter
 * Public route - no authentication required
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const { page, limit, rating } = listReviewsQuerySchema.parse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      rating: searchParams.get("rating") ?? undefined,
    });

    const result = await listReviewsService({
      page,
      limit,
      ratingFilter: rating,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/reviews
 * Create a new review
 * Public route - no authentication required, but rate limited
 */
export async function POST(req: NextRequest) {
  try {
    const clientIP = getClientIP(req);

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
              (rateLimitResult.resetTime - Date.now()) / 1000,
            ).toString(),
          },
        },
      );
    }

    const data = reviewsSchema.parse(await req.json());

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
      },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
