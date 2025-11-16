import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";

interface CreateReviewData {
  rating: number;
  comment: string;
  name?: string;
  email?: string;
}

interface ListReviewsParams {
  page?: number;
  limit?: number;
  ratingFilter?: number;
}

/**
 * List reviews with pagination and optional rating filter
 */
export async function listReviewsService({
  page = 1,
  limit = 10,
  ratingFilter,
}: ListReviewsParams = {}) {
  const skip = (page - 1) * limit;
  const take = limit;

  const where = ratingFilter
    ? {
        rating: ratingFilter,
      }
    : {};

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take,
    }),
    prisma.review.count({ where }),
  ]);

  logger.info("Reviews listed", {
    page,
    limit,
    ratingFilter,
    total,
    returned: reviews.length,
  });

  return {
    reviews,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Create a new review
 */
export async function createReviewService(data: CreateReviewData) {
  // Validate rating is between 1 and 5
  if (data.rating < 1 || data.rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  // Validate comment is not empty
  if (!data.comment || data.comment.trim().length === 0) {
    throw new Error("Comment is required");
  }

  const review = await prisma.review.create({
    data: {
      rating: data.rating,
      comment: data.comment.trim(),
      name: data.name?.trim() || null,
      email: data.email?.trim() || null,
    },
  });

  logger.info("Review created", { reviewId: review.id, rating: review.rating });

  return review;
}

