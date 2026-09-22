"use client";
import { Send, Star } from "lucide-react";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { TReviewsSchema } from "../reviewsZod";

interface ReviewFormProps {
  form: UseFormReturn<TReviewsSchema>;
  onSubmit: (values: TReviewsSchema) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  rateLimitError: string | null;
}

export function ReviewForm({
  form,
  onSubmit,
  onCancel,
  isSubmitting,
  rateLimitError,
}: ReviewFormProps) {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className='bg-white/5 backdrop-blur-2xl border border-amber-500/30 rounded-2xl p-6 md:p-10 shadow-2xl'>
      <div className='flex items-center justify-between mb-8'>
        <h2 className='text-3xl font-bold'>Write a Review</h2>
        <button
          onClick={onCancel}
          className='text-slate-400 hover:text-white transition-colors text-sm'
        >
          Cancel
        </button>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
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
            isSubmitting || !form.watch("rating") || !form.watch("comment")?.trim()
          }
          className='w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-base hover:from-amber-600 hover:to-orange-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-amber-500/50 hover:scale-[1.02]'
        >
          <Send className='w-5 h-5' />
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  );
}
