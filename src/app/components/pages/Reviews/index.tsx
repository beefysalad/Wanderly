"use client";

import { useState } from "react";
import { useReviews } from "@/src/hooks/useReviews";
import { EYEBROW } from "../../shared/Site/PageHero";
import { Reveal } from "../../shared/Site/Reveal";
import { COPYRIGHT } from "../../shared/Site/SiteFooter";
import { SiteShell } from "../../shared/Site/SiteShell";
import { ReviewCards } from "./ReviewCards";
import { ReviewForm } from "./ReviewForm";
import { ReviewsSummary } from "./ReviewsSummary";

const PAGE_SIZE = 6;

const ReviewsComponent = () => {
  const [limit, setLimit] = useState(PAGE_SIZE);

  // Every review feeds the average and the rating spread; only `limit` of them are shown as cards.
  const { data: everything, isLoading: statsLoading } = useReviews(1, 10000);
  const { data: shown, isLoading, isError } = useReviews(1, limit);

  const reviews = shown?.reviews ?? [];
  const total = shown?.total ?? 0;

  return (
    <SiteShell active='/reviews' footerCopyright={COPYRIGHT.location} footerLinks={["home", "about", "howTo", "faq"]}>
      <section className='relative z-[1] mx-auto box-content grid max-w-[1100px] grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] items-end gap-[clamp(28px,4vw,56px)] px-[clamp(20px,4vw,48px)] pb-[clamp(28px,3.5vw,44px)] pt-[clamp(48px,7vw,96px)]'>
        <div className='min-w-0'>
          <Reveal immediate distance={24} delay={0.05}>
            <p className={`mb-[14px] ${EYEBROW}`}>Reviews</p>
          </Reveal>
          <Reveal immediate distance={24} delay={0.14}>
            <h1 className='mb-[18px] text-[clamp(38px,5.4vw,60px)] font-extrabold leading-[1.02] tracking-[-.035em]'>
              What early groups say.
            </h1>
          </Reveal>
          <Reveal immediate distance={24} delay={0.23}>
            <p className='max-w-[32em] text-[17px] leading-[1.7] text-[#94a3b8]'>
              Unedited, including the bits about what&apos;s still missing. If you&apos;ve used it for a trip, leave
              one below.
            </p>
          </Reveal>
        </div>
        <Reveal immediate distance={24} delay={0.32} className='min-w-0'>
          <ReviewsSummary reviews={everything?.reviews ?? []} ready={!statsLoading && !!everything} />
        </Reveal>
      </section>

      <section className='relative z-[1] mx-auto box-content max-w-[1100px] px-[clamp(20px,4vw,48px)] pb-[clamp(40px,5vw,64px)]'>
        {isLoading ? (
          <p className='text-[15px] text-[#94a3b8]'>Loading reviews…</p>
        ) : isError ? (
          <p className='text-[15px] text-[#f87171]'>Couldn&apos;t load reviews right now. Please try again later.</p>
        ) : reviews.length === 0 ? (
          <p className='text-[15px] text-[#94a3b8]'>No reviews yet — be the first to leave one below.</p>
        ) : (
          <>
            <ReviewCards reviews={reviews} />
            {reviews.length < total ? (
              <div className='mt-8 flex justify-center'>
                <button
                  type='button'
                  onClick={() => setLimit((current) => current + PAGE_SIZE)}
                  className='cursor-pointer rounded-full border border-white/[.14] bg-white/[.03] px-6 py-3 text-[15px] font-semibold text-[#e2e8f0]'
                >
                  Show more reviews
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>

      <section className='relative z-[1] border-t border-white/[.06] bg-[rgba(15,23,42,.35)] px-[clamp(20px,4vw,48px)] py-[clamp(48px,6vw,88px)]'>
        <Reveal distance={24} className='mx-auto max-w-[620px]'>
          <h2 className='mb-[10px] text-[clamp(24px,3.2vw,36px)] font-extrabold tracking-[-.03em]'>
            Used it for a trip? Say so.
          </h2>
          <p className='mb-6 text-base text-[#94a3b8]'>
            Including the parts that annoyed you — that&apos;s the useful half.
          </p>
          <ReviewForm />
        </Reveal>
      </section>
    </SiteShell>
  );
};

export default ReviewsComponent;
