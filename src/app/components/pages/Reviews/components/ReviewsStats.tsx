import { Star, TrendingUp } from "lucide-react";
import type { Review } from "@/src/shared/types";

interface ReviewsStatsProps {
  allReviews: Review[];
  isLoading: boolean;
}

export function ReviewsStats({ allReviews, isLoading }: ReviewsStatsProps) {
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

  const ratingDistribution = getRatingDistribution();

  return (
    <div className='grid md:grid-cols-3 gap-6 max-w-4xl mx-auto'>
      {isLoading ? (
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
              {allReviews.length > 0 ? getPercentage(ratingDistribution[0]) : 0}%
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
  );
}
