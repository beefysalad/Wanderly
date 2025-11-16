import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Review } from "@/src/shared/types";

interface ReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ReviewResponse {
  review: Review;
}

interface CreateReviewRequest {
  rating: number;
  comment: string;
  name?: string;
  email?: string;
}

/**
 * Query hook to fetch reviews with pagination and optional rating filter
 */
export function useReviews(
  page: number = 1,
  limit: number = 10,
  ratingFilter?: number | null
) {
  return useQuery<ReviewsResponse>({
    queryKey: ["reviews", page, limit, ratingFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (ratingFilter) {
        params.append("rating", ratingFilter.toString());
      }
      const response = await api.get<ReviewsResponse>(
        `/reviews?${params.toString()}`
      );
      return response.data;
    },
  });
}

/**
 * Mutation hook to create a new review
 */
export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation<ReviewResponse, Error, CreateReviewRequest>({
    mutationFn: async (data) => {
      const response = await api.post<ReviewResponse>("/reviews", data);
      return response.data;
    },
    onSuccess: async () => {
      // Invalidate and refetch all reviews queries
      await queryClient.invalidateQueries({ queryKey: ["reviews"] });
      // Explicitly refetch to ensure data is fresh
      await queryClient.refetchQueries({ queryKey: ["reviews"] });
    },
  });
}

