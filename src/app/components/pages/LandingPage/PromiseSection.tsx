"use client";

import { useQuery } from "@tanstack/react-query";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { Reveal } from "../../shared/Site/Reveal";
import { EASE, useCountUp } from "../../shared/Site/motion";

const GOAL = 1000;

export function PromiseSection() {
  const { data: userCount } = useQuery({
    queryKey: ["userCount"],
    queryFn: async () => {
      const res = await fetch("/api/stats/user-count");
      if (!res.ok) throw new Error("Failed to fetch user count");
      const data = await res.json();
      return data.count as number;
    },
  });

  // Start counting once the card is on screen and the real number has arrived.
  const cardRef = useRef<HTMLDivElement>(null);
  const inView = useInView(cardRef, { once: true, margin: "0px 0px -20% 0px" });
  const ready = inView && userCount !== undefined;

  const users = userCount ?? 0;
  const shown = useCountUp(users, { durationSec: 1.5, enabled: ready });
  const percentage = Math.min((users / GOAL) * 100, 100);

  return (
    <section
      id='promise'
      className='relative z-[1] border-t border-white/[.06] bg-[rgba(15,23,42,.35)] px-[clamp(20px,4vw,48px)] py-[clamp(56px,7vw,96px)]'
    >
      <div className='mx-auto grid max-w-[880px] grid-cols-[repeat(auto-fit,minmax(260px,1fr))] items-center gap-[clamp(28px,4vw,56px)]'>
        <Reveal className='min-w-0'>
          <p className='mb-3 font-mono text-[11px] uppercase tracking-[.2em] text-[#60a5fa]'>The honest bit</p>
          <h2 className='mb-[14px] text-[clamp(26px,3.2vw,38px)] font-extrabold tracking-[-.025em]'>
            There&apos;s no app yet. There&apos;s a promise.
          </h2>
          <p className='mb-[18px] text-base leading-[1.7] text-[#94a3b8]'>
            I&apos;m one person. I&apos;d rather make the web version genuinely good than ship a half-baked app — so add
            Wanderly to your home screen and it behaves like one.
          </p>
          <Link
            href='/how-to#save-to-home-screen'
            className='inline-flex items-center gap-2 text-[15px] font-semibold text-[#60a5fa]'
          >
            Add to home screen <ArrowRight className='size-[15px]' />
          </Link>
        </Reveal>

        <Reveal className='min-w-0'>
          <div
            ref={cardRef}
            className='rounded-[20px] border border-[rgba(96,165,250,.22)] bg-[rgba(2,6,23,.6)] p-[26px]'
          >
            <p className='mb-[6px] text-[15px] text-[#cbd5e1]'>
              At <strong className='text-white'>1,000 active users</strong> I drop everything and build native iOS +
              Android.
            </p>
            <p className='mb-[10px] mt-[18px] text-[clamp(34px,5vw,46px)] font-extrabold tracking-[-.03em] tabular-nums text-[#f8fafc]'>
              {shown.toLocaleString("en-US")}
            </p>
            <div className='h-[10px] w-full overflow-hidden rounded-full bg-[rgba(51,65,85,.6)]'>
              <motion.div
                className='h-full rounded-full bg-[linear-gradient(90deg,#3b82f6,#22d3ee)]'
                initial={{ width: "0%" }}
                animate={{ width: ready ? `${percentage}%` : "0%" }}
                transition={{ duration: 1.5, ease: EASE }}
              />
            </div>
            <div className='mt-[10px] flex justify-between font-mono text-[11px] text-[#64748b]'>
              <span>signed up so far</span>
              <span>goal 1,000</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
