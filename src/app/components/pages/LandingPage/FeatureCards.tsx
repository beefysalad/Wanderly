"use client";

import { motion } from "framer-motion";
import { ArrowRight, Calendar, Link2, Wallet, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Reveal } from "../../shared/Site/Reveal";
import { EASE, useRevealDistance } from "../../shared/Site/motion";

const FEATURES: { icon: LucideIcon; title: string; body: string; href: string }[] = [
  {
    icon: Calendar,
    title: "One schedule",
    body: "Everyone's on the same day, hour by hour. Export it to the calendar app they already use.",
    href: "/features",
  },
  {
    icon: Wallet,
    title: "One running tab",
    body: "Log it, split it, settle it. Nobody has to be the spreadsheet guy this time.",
    href: "/features",
  },
  {
    icon: Link2,
    title: "One code",
    body: "Six characters gets anyone in — read-only, no account, no nagging.",
    href: "/guest/join",
  },
];

export function FeatureCards() {
  const distance = useRevealDistance();

  return (
    <section
      id='features'
      className='relative z-[1] mx-auto box-content max-w-[1240px] px-[clamp(20px,4vw,48px)] py-[clamp(48px,6vw,88px)]'
    >
      <Reveal className='mb-[clamp(24px,3vw,36px)] flex flex-wrap items-end justify-between gap-4'>
        <h2 className='max-w-[16em] text-[clamp(26px,3.4vw,42px)] font-extrabold tracking-[-.03em]'>
          Three things, done properly.
        </h2>
        <Link
          href='/features'
          className='inline-flex items-center gap-2 text-[15px] font-semibold text-[#fbbf24] hover:text-[#fcd34d]'
        >
          All the features <ArrowRight className='size-[15px]' />
        </Link>
      </Reveal>

      <motion.div
        className='grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-[clamp(16px,2.4vw,24px)]'
        initial='hidden'
        whileInView='visible'
        viewport={{ once: true, margin: "0px 0px -12% 0px" }}
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.09 } } }}
      >
        {FEATURES.map(({ icon: Icon, title, body, href }) => (
          <motion.div
            key={title}
            variants={{
              hidden: { opacity: 0, y: distance + 8, scale: 0.98 },
              visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: EASE } },
            }}
            whileHover={{ y: -4, transition: { duration: 0.25, ease: EASE } }}
          >
            <Link
              href={href}
              className='block rounded-[20px] border border-white/[.07] bg-[rgba(15,23,42,.45)] px-6 py-[26px] text-inherit transition-[border-color] duration-[250ms] hover:border-[rgba(251,191,36,.3)]'
            >
              <Icon className='size-[22px] text-[#fbbf24]' />
              <h3 className='mb-2 mt-4 text-[19px] font-bold'>{title}</h3>
              <p className='text-[15px] leading-[1.65] text-[#94a3b8]'>{body}</p>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
