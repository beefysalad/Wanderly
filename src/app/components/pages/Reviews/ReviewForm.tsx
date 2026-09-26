"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useCreateReview } from "@/src/hooks/useReviews";
import { reviewsSchema, type TReviewsSchema } from "./reviewsZod";

const LABEL = "font-mono text-[10px] uppercase tracking-[.16em] text-[#94a3b8]";
const FIELD =
  "w-full rounded-xl border border-white/[.1] bg-[rgba(2,6,23,.6)] px-[15px] py-[13px] text-[15px] text-[#f8fafc] transition-[border-color,box-shadow] duration-[180ms] placeholder:text-[#475569] focus:border-[rgba(251,191,36,.55)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(251,191,36,.12)]";

/** "Used it for a trip? Say so." — posts a real review. */
export function ReviewForm() {
  const createReview = useCreateReview();
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<TReviewsSchema>({
    resolver: zodResolver(reviewsSchema),
    defaultValues: { rating: 0, name: "", comment: "", email: "" },
  });
  const rating = form.watch("rating");
  const errors = form.formState.errors;

  const onSubmit = async (values: TReviewsSchema) => {
    setServerError(null);
    try {
      await createReview.mutateAsync({ rating: values.rating, comment: values.comment, name: values.name || undefined });
      form.reset();
      setSent(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setServerError(
        err?.response?.status === 429
          ? "You've submitted too many reviews. Please try again later."
          : err?.response?.data?.error || "Failed to submit review. Please try again.",
      );
    }
  };

  const label = createReview.isPending ? "Posting…" : sent ? "Thanks — sent" : "Post review";

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-[14px]'>
      <div className='flex items-center gap-3'>
        <span className={LABEL}>Rating</span>
        <div className='flex gap-1'>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type='button'
              aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
              onClick={() => {
                form.setValue("rating", star, { shouldValidate: true });
                setSent(false);
              }}
              className={`cursor-pointer p-[2px] text-2xl leading-none ${rating >= star ? "text-[#fbbf24]" : "text-[#334155]"}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      {errors.rating ? <p className='text-[13px] text-[#f87171]'>{errors.rating.message}</p> : null}

      <label className='flex flex-col gap-[7px]'>
        <span className={LABEL}>Your name</span>
        <input {...form.register("name")} type='text' placeholder='Maya J.' className={FIELD} />
      </label>

      <label className='flex flex-col gap-[7px]'>
        <span className={LABEL}>Your review</span>
        <textarea
          {...form.register("comment")}
          rows={4}
          placeholder="What worked, what didn't."
          className={`${FIELD} resize-y leading-[1.6]`}
        />
        {errors.comment ? <span className='text-[13px] text-[#f87171]'>{errors.comment.message}</span> : null}
      </label>

      {serverError ? <p className='text-[13px] text-[#f87171]'>{serverError}</p> : null}

      <button
        type='submit'
        disabled={createReview.isPending}
        className='flex w-full cursor-pointer items-center justify-center gap-[10px] rounded-xl bg-[linear-gradient(100deg,#fbbf24,#f97316)] p-4 text-base font-extrabold text-[#160c02] shadow-[0_18px_40px_-18px_rgba(251,146,60,.9)] disabled:cursor-not-allowed disabled:opacity-60'
      >
        {label}
      </button>
    </form>
  );
}
