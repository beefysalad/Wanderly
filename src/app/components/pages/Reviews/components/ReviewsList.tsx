import { formatDistanceToNow } from "date-fns";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import type { Review } from "@/src/shared/types";

interface ReviewsListProps {
  reviews: Review[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  starFilter: number | null;
  onStarFilterChange: (filter: number | null) => void;
  currentPage: number;
  totalPages: number;
  totalReviews: number;
  reviewsPerPage: number;
  onPageChange: (page: number) => void;
}

function formatDate(dateString: string) {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
}

export function ReviewsList({
  reviews,
  isLoading,
  isError,
  error,
  starFilter,
  onStarFilterChange,
  currentPage,
  totalPages,
  totalReviews,
  reviewsPerPage,
  onPageChange,
}: ReviewsListProps) {
  return (
    <>
      {!isLoading && (
        <div className='flex flex-wrap justify-center gap-3 mb-8'>
          <button
            onClick={() => onStarFilterChange(null)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              starFilter === null
                ? "bg-amber-500 text-white shadow-lg"
                : "bg-white/10 text-slate-300 hover:bg-white/20"
            }`}
          >
            All Reviews
          </button>
          {[5, 4, 3, 2, 1].map((stars) => (
            <button
              key={stars}
              onClick={() => onStarFilterChange(stars)}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                starFilter === stars
                  ? "bg-amber-500 text-white shadow-lg"
                  : "bg-white/10 text-slate-300 hover:bg-white/20"
              }`}
            >
              <Star className='w-4 h-4 fill-current' />
              {stars}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className='text-center py-24 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10'>
          <div className='w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full flex items-center justify-center'>
            <div className='w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin'></div>
          </div>
          <p className='text-slate-300 text-xl'>Loading</p>
        </div>
      ) : isError ? (
        <div className='text-center py-24 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10'>
          <div className='w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center'>
            <Star className='w-10 h-10 text-red-400' />
          </div>
          <p className='text-slate-300 text-xl mb-2'>Failed to load reviews</p>
          <p className='text-slate-500'>
            {error instanceof Error ? error.message : "Please try again later"}
          </p>
        </div>
      ) : reviews.length === 0 ? (
        <div className='text-center py-24 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10'>
          <div className='w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full flex items-center justify-center'>
            <Star className='w-10 h-10 text-amber-400' />
          </div>
          <p className='text-slate-300 text-xl mb-2'>
            {starFilter ? `No ${starFilter}-star reviews yet` : "No reviews yet"}
          </p>
          <p className='text-slate-500'>
            {starFilter ? "Try a different filter" : "Be the first to share your experience!"}
          </p>
        </div>
      ) : (
        <>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {reviews.map((review) => (
              <div
                key={review.id}
                className='bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:border-amber-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10'
              >
                <div className='flex items-center gap-3 mb-4'>
                  <div className='w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-base'>
                    {(review.name || review.email || "A")[0].toUpperCase()}
                  </div>
                  <div className='flex-1'>
                    <p className='font-semibold text-white text-sm'>
                      {review.name || review.email || "Anonymous"}
                    </p>
                    <p className='text-xs text-slate-400'>
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                </div>

                <div className='flex items-center gap-1 mb-3'>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= review.rating
                          ? "fill-amber-400 text-amber-400"
                          : "fill-slate-700 text-slate-700"
                      }`}
                    />
                  ))}
                </div>

                <p className='text-slate-200 leading-relaxed text-sm'>
                  {review.comment}
                </p>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className='flex items-center justify-center gap-4 mt-12'>
              <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className='p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all'
              >
                <ChevronLeft className='w-5 h-5' />
              </button>

              <div className='flex items-center gap-2'>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`w-10 h-10 rounded-lg font-medium transition-all ${
                      currentPage === page
                        ? "bg-amber-500 text-white shadow-lg"
                        : "bg-white/10 text-slate-300 hover:bg-white/20"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className='p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all'
              >
                <ChevronRight className='w-5 h-5' />
              </button>
            </div>
          )}

          <p className='text-center text-slate-400 text-sm mt-6'>
            Showing{" "}
            {reviews.length > 0 ? (currentPage - 1) * reviewsPerPage + 1 : 0}-
            {Math.min(currentPage * reviewsPerPage, totalReviews)} of {totalReviews}{" "}
            reviews
          </p>
        </>
      )}
    </>
  );
}
