"use client";
import { useCreateReview, useReviews } from "@/src/hooks/useReviews";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Send,
  Star,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Footer from "../../shared/Footer";
import { reviewsSchema, TReviewsSchema } from "./reviewsZod";

const ReviewsComponent = () => {
  const router = useRouter();
  const [hoverRating, setHoverRating] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const reviewsPerPage = 6;

  // Fetch all reviews for stats (no pagination)
  const { data: allReviewsData, isLoading: isLoadingAll } = useReviews(
    1,
    10000,
  );
  const allReviews = allReviewsData?.reviews || [];

  // Fetch paginated reviews
  const {
    data: reviewsData,
    isLoading,
    isError,
    error,
  } = useReviews(currentPage, reviewsPerPage, starFilter || undefined);

  const reviews = reviewsData?.reviews || [];
  const totalPages = reviewsData?.totalPages || 0;
  const totalReviews = reviewsData?.total || 0;

  const createReviewMutation = useCreateReview();

  const form = useForm<TReviewsSchema>({
    resolver: zodResolver(reviewsSchema),
    defaultValues: {
      comment: "",
      rating: 0,
      name: "",
      email: "",
    },
  });

  const onSubmit = async (values: TReviewsSchema) => {
    setRateLimitError(null);
    try {
      await createReviewMutation.mutateAsync({
        rating: values.rating,
        comment: values.comment,
        name: values.name,
        email: values.email,
      });
      // Reset form and close
      form.reset();
      setShowReviewForm(false);
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err?.response?.status === 429) {
        setRateLimitError(
          "You've submitted too many reviews. Please try again later.",
        );
      } else {
        setRateLimitError(
          err?.response?.data?.error ||
            "Failed to submit review. Please try again.",
        );
      }
    }
  };

  const calculateAverageRating = () => {
    if (allReviews.length === 0) return "0";
    const sum = allReviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / allReviews.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const distribution = [0, 0, 0, 0, 0];
    allReviews.forEach((review) => {
      distribution[review.rating - 1]++;
    });
    return distribution.reverse();
  };

  const getPercentage = (count: number) => {
    if (allReviews.length === 0) return 0;
    return Math.round((count / allReviews.length) * 100);
  };

  const formatDate = (dateString: string) => {
    const reviewDate = new Date(dateString);
    return formatDistanceToNow(reviewDate, { addSuffix: true });
  };

  const ratingDistribution = getRatingDistribution();
  return (
    <div className='min-h-screen bg-slate-950 text-white relative overflow-hidden'>
      {/* Background Effects matching Login/Register */}
      <div className='absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none'>
        <div className='absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-3xl animate-pulse-glow'></div>
        <div className='absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-3xl animate-pulse-glow delay-1000'></div>
      </div>

      <div className='relative z-10'>
        <div className='px-4 md:px-8 py-6'>
          <button
            onClick={() => router.push("/")}
            className='flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors group'
          >
            <ArrowLeft className='w-5 h-5 group-hover:-translate-x-1 transition-transform' />
            <span className='font-medium'>Back to Home</span>
          </button>
        </div>

        <div className='px-4 md:px-8 py-12 md:py-20'>
          <div className='max-w-5xl mx-auto'>
            <div className='flex items-center gap-3 mb-6 justify-center'>
              <h1 className='text-5xl md:text-7xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 bg-clip-text text-transparent'>
                Reviews
              </h1>
            </div>

            <p className='text-center text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto'>
              See what travelers are saying about their Wanderly experience
            </p>

            <div className='grid md:grid-cols-3 gap-6 max-w-4xl mx-auto'>
              {isLoadingAll ? (
                <>
                  <div className='bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-xl border border-amber-500/30 rounded-2xl p-6 text-center'>
                    <div className='text-5xl font-bold text-amber-400 mb-2'>
                      <div className='w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto'></div>
                    </div>
                <p className='text-sm text-slate-400 mt-4'>Loading</p>
                  </div>
                  <div className='bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 text-center'>
                    <div className='text-5xl font-bold text-purple-400 mb-2'>
                      <div className='w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto'></div>
                    </div>
                <p className='text-sm text-slate-400 mt-4'>Loading</p>
                  </div>
                  <div className='bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-6 text-center'>
                    <div className='text-5xl font-bold text-emerald-400 mb-2'>
                      <div className='w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto'></div>
                    </div>
                <p className='text-sm text-slate-400 mt-4'>Loading</p>
                  </div>
                </>
              ) : (
                <>
                  <div className='bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-xl border border-amber-500/30 rounded-2xl p-6 text-center'>
                    <div className='text-5xl font-bold text-amber-400 mb-2'>
                      {calculateAverageRating()}
                    </div>
                    <div className='flex justify-center mb-2'>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= Math.round(Number(calculateAverageRating()))
                              ? "fill-amber-400 text-amber-400"
                              : "fill-slate-600 text-slate-600"
                          }`}
                        />
                      ))}
                    </div>
                    <p className='text-sm text-slate-400'>Average Rating</p>
                  </div>

                  <div className='bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 text-center'>
                    <div className='text-5xl font-bold text-purple-400 mb-2'>
                      {allReviews.length}
                    </div>
                    <div className='flex items-center justify-center gap-2 mb-2'>
                      <TrendingUp className='w-5 h-5 text-purple-400' />
                    </div>
                    <p className='text-sm text-slate-400'>Total Reviews</p>
                  </div>

                  <div className='bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-6 text-center'>
                    <div className='text-5xl font-bold text-emerald-400 mb-2'>
                      {allReviews.length > 0
                        ? getPercentage(ratingDistribution[0])
                        : 0}
                      %
                    </div>
                    <div className='flex justify-center mb-2'>
                      <Star className='w-5 h-5 fill-emerald-400 text-emerald-400' />
                      <Star className='w-5 h-5 fill-emerald-400 text-emerald-400' />
                      <Star className='w-5 h-5 fill-emerald-400 text-emerald-400' />
                      <Star className='w-5 h-5 fill-emerald-400 text-emerald-400' />
                      <Star className='w-5 h-5 fill-emerald-400 text-emerald-400' />
                    </div>
                    <p className='text-sm text-slate-400'>5-Star Reviews</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className='px-4 md:px-8 py-8'>
          <div className='max-w-4xl mx-auto'>
            {!showReviewForm ? (
              <button
                onClick={() => setShowReviewForm(true)}
                className='w-full md:w-auto md:mx-auto md:block group relative overflow-hidden bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl px-8 py-3 transition-all duration-300 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105'
              >
                <div className='flex items-center justify-center gap-2'>
                  <Send className='w-4 h-4 group-hover:rotate-12 transition-transform' />
                  <span className='text-base font-semibold'>
                    Share Your Experience
                  </span>
                </div>
              </button>
            ) : (
              <div className='bg-white/5 backdrop-blur-2xl border border-amber-500/30 rounded-2xl p-6 md:p-10 shadow-2xl'>
                <div className='flex items-center justify-between mb-8'>
                  <h2 className='text-3xl font-bold'>Write a Review</h2>
                  <button
                    onClick={() => setShowReviewForm(false)}
                    className='text-slate-400 hover:text-white transition-colors text-sm'
                  >
                    Cancel
                  </button>
                </div>

                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className='space-y-6'
                >
                  <div>
                    <label className='block text-sm font-semibold mb-4 text-amber-400'>
                      How would you rate your experience?
                    </label>
                    <div className='flex gap-3 justify-center md:justify-start'>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type='button'
                          onClick={() => form.setValue("rating", star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className='transition-all hover:scale-125 active:scale-95'
                        >
                          <Star
                            className={`w-8 h-8 ${
                              star <= (hoverRating || form.watch("rating") || 0)
                                ? "fill-amber-400 text-amber-400"
                                : "fill-slate-700 text-slate-700 hover:fill-slate-600"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    {form.formState.errors.rating && (
                      <p className='text-red-400 text-sm mt-2'>
                        {form.formState.errors.rating.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor='comment'
                      className='block text-sm font-semibold mb-3 text-amber-400'
                    >
                      Tell us more
                    </label>
                    <textarea
                      id='comment'
                      {...form.register("comment")}
                      rows={5}
                      className='w-full px-5 py-4 bg-slate-900/70 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-white placeholder-slate-500 transition-all'
                      placeholder='What did you love about Wanderly? Any suggestions?'
                    />
                    {form.formState.errors.comment && (
                      <p className='text-red-400 text-sm mt-2'>
                        {form.formState.errors.comment.message}
                      </p>
                    )}
                  </div>

                  <div className='grid md:grid-cols-2 gap-5'>
                    <div>
                      <label
                        htmlFor='name'
                        className='block text-sm font-medium mb-2 text-slate-300'
                      >
                        Name (Optional)
                      </label>
                      <input
                        type='text'
                        id='name'
                        {...form.register("name")}
                        className='w-full px-5 py-3 bg-slate-900/70 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-white placeholder-slate-500 transition-all'
                        placeholder='Your name'
                      />
                    </div>

                    <div>
                      <label
                        htmlFor='email'
                        className='block text-sm font-medium mb-2 text-slate-300'
                      >
                        Email (Optional)
                      </label>
                      <input
                        type='email'
                        id='email'
                        {...form.register("email")}
                        className='w-full px-5 py-3 bg-slate-900/70 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-white placeholder-slate-500 transition-all'
                        placeholder='your@email.com'
                      />
                      {form.formState.errors.email && (
                        <p className='text-red-400 text-sm mt-2'>
                          {form.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {rateLimitError && (
                    <div className='bg-red-500/10 border border-red-500/30 rounded-xl p-4'>
                      <p className='text-red-400 text-sm'>{rateLimitError}</p>
                    </div>
                  )}

                  <button
                    type='submit'
                    disabled={
                      createReviewMutation.isPending ||
                      !form.watch("rating") ||
                      !form.watch("comment")?.trim()
                    }
                    className='w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-base hover:from-amber-600 hover:to-orange-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-amber-500/50 hover:scale-[1.02]'
                  >
                    <Send className='w-5 h-5' />
                    {createReviewMutation.isPending
                      ? "Submitting..."
                      : "Submit Review"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        <div className='px-4 md:px-8 py-16'>
          <div className='max-w-6xl mx-auto'>
            <h2 className='text-4xl font-bold mb-8 text-center'>
              What People Are Saying
            </h2>

            {!isLoading && (
              <div className='flex flex-wrap justify-center gap-3 mb-8'>
                <button
                  onClick={() => {
                    setStarFilter(null);
                    setCurrentPage(1);
                  }}
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
                    onClick={() => {
                      setStarFilter(stars);
                      setCurrentPage(1);
                    }}
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
                <p className='text-slate-300 text-xl mb-2'>
                  Failed to load reviews
                </p>
                <p className='text-slate-500'>
                  {error instanceof Error
                    ? error.message
                    : "Please try again later"}
                </p>
              </div>
            ) : reviews.length === 0 ? (
              <div className='text-center py-24 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10'>
                <div className='w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full flex items-center justify-center'>
                  <Star className='w-10 h-10 text-amber-400' />
                </div>
                <p className='text-slate-300 text-xl mb-2'>
                  {starFilter
                    ? `No ${starFilter}-star reviews yet`
                    : "No reviews yet"}
                </p>
                <p className='text-slate-500'>
                  {starFilter
                    ? "Try a different filter"
                    : "Be the first to share your experience!"}
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
                          {(review.name ||
                            review.email ||
                            "A")[0].toUpperCase()}
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
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                      className='p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all'
                    >
                      <ChevronLeft className='w-5 h-5' />
                    </button>

                    <div className='flex items-center gap-2'>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded-lg font-medium transition-all ${
                              currentPage === page
                                ? "bg-amber-500 text-white shadow-lg"
                                : "bg-white/10 text-slate-300 hover:bg-white/20"
                            }`}
                          >
                            {page}
                          </button>
                        ),
                      )}
                    </div>

                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                      className='p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all'
                    >
                      <ChevronRight className='w-5 h-5' />
                    </button>
                  </div>
                )}

                <p className='text-center text-slate-400 text-sm mt-6'>
                  Showing{" "}
                  {reviews.length > 0
                    ? (currentPage - 1) * reviewsPerPage + 1
                    : 0}
                  -{Math.min(currentPage * reviewsPerPage, totalReviews)} of{" "}
                  {totalReviews} reviews
                </p>
              </>
            )}
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default ReviewsComponent;
