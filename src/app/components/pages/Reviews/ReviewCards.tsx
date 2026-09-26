"use client";

import { motion } from "framer-motion";
import type { Review } from "@/src/shared/types";
import { StaggerGroup, StaggerItem } from "../../shared/Site/Stagger";
import { EASE } from "../../shared/Site/motion";

const AVATAR_COLORS = ["bg-[#fbbf24]", "bg-[#38bdf8]", "bg-[#a78bfa]", "bg-[#34d399]", "bg-[#fb923c]", "bg-[#f472b6]"];

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export function ReviewCards({ reviews }: { reviews: Review[] }) {
  return (
    <StaggerGroup
      gap={0.07}
      margin='0px 0px -10% 0px'
      className='grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-[clamp(16px,2.4vw,24px)]'
    >
      {reviews.map((review, index) => {
        const name = review.name?.trim() || "Anonymous";
        return (
          <StaggerItem key={review.id} duration={0.65}>
            <motion.div
              whileHover={{ y: -4, transition: { duration: 0.25, ease: EASE } }}
              className='flex h-full flex-col gap-[14px] rounded-[20px] border border-white/[.07] bg-[rgba(15,23,42,.45)] p-6 transition-[border-color] duration-[250ms] hover:border-[rgba(251,191,36,.28)]'
            >
              <div className='flex items-center gap-3'>
                <span
                  className={`flex size-9 flex-none items-center justify-center rounded-full text-[13px] font-extrabold text-[#0b1120] ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}
                >
                  {initials(name)}
                </span>
                <div className='min-w-0'>
                  <p className='truncate text-[15px] font-bold'>{name}</p>
                  <p className='mt-[2px] font-mono text-[10px] uppercase tracking-[.1em] text-[#64748b]'>
                    {formatDate(review.createdAt)}
                  </p>
                </div>
              </div>
              <p className='text-[15px] tracking-[.14em] text-[#fbbf24]' aria-label={`${review.rating} out of 5 stars`}>
                {"★".repeat(review.rating)}
                {"☆".repeat(5 - review.rating)}
              </p>
              <p className='break-words text-[15px] leading-[1.7] text-[#cbd5e1]'>{review.comment}</p>
            </motion.div>
          </StaggerItem>
        );
      })}
    </StaggerGroup>
  );
}
