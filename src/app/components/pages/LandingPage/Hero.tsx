"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { HeroMock } from "./HeroMock";
import { EASE, useRevealDistance } from "./motion";

const HEADLINE = [
  { text: "Everyone's in.", accent: false },
  { text: "Nobody knows", accent: false },
  { text: "the plan.", accent: false },
  { text: "Fix that in one link.", accent: true },
];

export function Hero() {
  const distance = useRevealDistance();

  // The supporting copy follows the headline, one element after the other.
  const fadeUp = (order: number) => ({
    initial: { opacity: 0, y: distance },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay: 0.45 + order * 0.08, ease: EASE },
  });

  return (
    <section
      id='top'
      className='relative z-[1] mx-auto box-content grid max-w-[1240px] grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] items-center gap-[clamp(32px,5vw,72px)] px-[clamp(20px,4vw,48px)] pb-[clamp(32px,5vw,64px)] pt-[clamp(40px,7vw,96px)]'
    >
      <div className='min-w-0'>
        <h1 className='mb-[22px] text-balance text-[clamp(42px,6.4vw,78px)] font-extrabold leading-[.98] tracking-[-.035em]'>
          {HEADLINE.map((line, index) => (
            <motion.span
              key={line.text}
              initial={{ opacity: 0, y: distance + 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.05 + index * 0.09, ease: EASE }}
              className={`block ${line.accent ? "text-[#fbbf24]" : ""}`}
            >
              {line.text}
            </motion.span>
          ))}
        </h1>

        <motion.p
          {...fadeUp(0)}
          className='mb-8 max-w-[30em] text-[clamp(16px,1.5vw,19px)] leading-[1.65] text-[#94a3b8]'
        >
          One shared schedule, one running tab, one six-character code. Your group chat can go back to being a group
          chat.
        </motion.p>

        <motion.div {...fadeUp(1)} className='mb-[22px] flex flex-wrap gap-3'>
          <Link
            href='/register'
            className='inline-flex items-center gap-[10px] rounded-full bg-[linear-gradient(100deg,#fbbf24,#f97316)] px-7 py-4 text-[17px] font-extrabold text-[#160c02] shadow-[0_18px_40px_-18px_rgba(251,146,60,.9)]'
          >
            Start free <ArrowRight className='size-[18px]' />
          </Link>
          <Link
            href='/guest/join'
            className='inline-flex items-center gap-[10px] rounded-full border border-white/[.14] bg-white/[.03] px-6 py-4 text-[17px] font-semibold text-[#e2e8f0]'
          >
            Got a code? Peek in
          </Link>
        </motion.div>

        <motion.div
          {...fadeUp(2)}
          className='flex items-center gap-[10px] font-mono text-xs tracking-[.04em] text-[#64748b]'
        >
          <Check className='size-[14px] text-[#34d399]' /> Free while it&apos;s just me building it · No card, no trial
          clock
        </motion.div>
      </div>

      <HeroMock />
    </section>
  );
}
