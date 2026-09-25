"use client";
import { useCreateReview, useReviews } from "@/src/hooks/useReviews";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Footer from "../../shared/Footer";
import { ReviewForm } from "./components/ReviewForm";
import { ReviewsList } from "./components/ReviewsList";
import { ReviewsStats } from "./components/ReviewsStats";
import { reviewsSchema, TReviewsSchema } from "./reviewsZod";

const ReviewsComponent = () => {
  const router = useRouter();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const reviewsPerPage = 6;

  const { data: allReviewsData, isLoading: isLoadingAll } = useReviews(1, 10000);
  const allReviews = allReviewsData?.reviews || [];

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
      form.reset();
      setShowReviewForm(false);
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err?.response?.status === 429) {
        setRateLimitError("You've submitted too many reviews. Please try again later.");
      } else {
        setRateLimitError(
          err?.response?.data?.error || "Failed to submit review. Please try again.",
        );
      }
    }
  };

  const handleStarFilterChange = (filter: number | null) => {
    setStarFilter(filter);
    setCurrentPage(1);
  };

  return (
    <div className='min-h-screen bg-slate-950 text-white relative overflow-hidden'>
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

            <ReviewsStats allReviews={allReviews} isLoading={isLoadingAll} />
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
                  <span className='text-base font-semibold'>Share Your Experience</span>
                </div>
              </button>
            ) : (
              <ReviewForm
                form={form}
                onSubmit={onSubmit}
                onCancel={() => setShowReviewForm(false)}
                isSubmitting={createReviewMutation.isPending}
                rateLimitError={rateLimitError}
              />
            )}
          </div>
        </div>

        <div className='px-4 md:px-8 py-16'>
          <div className='max-w-6xl mx-auto'>
            <h2 className='text-4xl font-bold mb-8 text-center'>
              What People Are Saying
            </h2>

            <ReviewsList
              reviews={reviews}
              isLoading={isLoading}
              isError={isError}
              error={error}
              starFilter={starFilter}
              onStarFilterChange={handleStarFilterChange}
              currentPage={currentPage}
              totalPages={totalPages}
              totalReviews={totalReviews}
              reviewsPerPage={reviewsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default ReviewsComponent;
