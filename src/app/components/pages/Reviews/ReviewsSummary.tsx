"use client";

import { motion } from "framer-motion";
import type { Review } from "@/src/shared/types";
import { EASE, useCountUp } from "../../shared/Site/motion";

const STARS = [5, 4, 3, 2, 1];

/** Average score and how the ratings are spread, from every review. */
export function ReviewsSummary({ reviews, ready }: { reviews: Review[]; ready: boolean }) {
  const total = reviews.length;
  const average = total ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
  const shown = useCountUp(average, { delayMs: 300, durationSec: 1.2, enabled: ready, decimals: 1 });

  return (
    <div className='min-w-0 rounded-[20px] border border-white/[.08] bg-[rgba(15,23,42,.55)] p-6'>
      <div className='mb-4 flex items-end gap-[14px]'>
        <p className='text-[clamp(40px,6vw,56px)] font-extrabold leading-none tracking-[-.04em] tabular-nums text-[#fbbf24]'>
          {shown.toFixed(1)}
        </p>
        <div className='pb-[6px]'>
          <p className='text-sm text-[#cbd5e1]'>out of 5</p>
          <p className='mt-[2px] font-mono text-[11px] text-[#64748b]'>
            {total} {total === 1 ? "review" : "reviews"} · beta
          </p>
        </div>
      </div>
      <div className='flex flex-col gap-[7px]'>
        {STARS.map((star, index) => {
          const count = reviews.filter((r) => r.rating === star).length;
          const percent = total ? (count / total) * 100 : 0;
          return (
            <div key={star} className='flex items-center gap-[10px]'>
              <span className='w-[14px] font-mono text-[11px] text-[#64748b]'>{star}</span>
              <span className='h-[7px] flex-1 overflow-hidden rounded-full bg-[rgba(51,65,85,.6)]'>
                <motion.span
                  className='block h-full bg-[#fbbf24]'
                  initial={{ width: "0%" }}
                  animate={{ width: ready ? `${percent}%` : "0%" }}
                  transition={{ duration: 1, delay: 0.35 + index * 0.08, ease: EASE }}
                />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
