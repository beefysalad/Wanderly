import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export interface FindReviewsPageParams {
  where: Prisma.ReviewWhereInput;
  skip: number;
  take: number;
}

export function findReviewsPage({ where, skip, take }: FindReviewsPageParams) {
  return prisma.review.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });
}

export function countReviews(where: Prisma.ReviewWhereInput) {
  return prisma.review.count({ where });
}

export interface CreateReviewRow {
  rating: number;
  comment: string;
  name: string | null;
  email: string | null;
}

export function createReview(data: CreateReviewRow) {
  return prisma.review.create({ data });
}
