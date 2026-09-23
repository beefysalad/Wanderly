import { logger } from "@/lib/logger";
import { countReviews, createReview, findReviewsPage } from "./repository";

export interface ListReviewsParams {
  page?: number;
  limit?: number;
  ratingFilter?: number;
}

export async function listReviewsService({
  page = 1,
  limit = 10,
  ratingFilter,
}: ListReviewsParams = {}) {
  const skip = (page - 1) * limit;
  const take = limit;
  const where = ratingFilter ? { rating: ratingFilter } : {};

  const [reviews, total] = await Promise.all([
    findReviewsPage({ where, skip, take }),
    countReviews(where),
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

export interface CreateReviewData {
  rating: number;
  comment: string;
  name?: string;
  email?: string;
}

export async function createReviewService(data: CreateReviewData) {
  const review = await createReview({
    rating: data.rating,
    comment: data.comment.trim(),
    name: data.name?.trim() || null,
    email: data.email?.trim() || null,
  });

  logger.info("Review created", { reviewId: review.id, rating: review.rating });

  return review;
}
