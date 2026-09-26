"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { CtaSection } from "../../shared/Site/CtaSection";
import { PageHero } from "../../shared/Site/PageHero";
import { COPYRIGHT } from "../../shared/Site/SiteFooter";
import { SiteShell } from "../../shared/Site/SiteShell";
import { EASE, useRevealDistance } from "../../shared/Site/motion";
import { FAQ_CATEGORIES, FAQ_ITEMS, type FaqCategory } from "./faqData";

const FaqComponent = () => {
  const [category, setCategory] = useState<FaqCategory>("All");
  const [open, setOpen] = useState(0);
  const distance = useRevealDistance(24);

  const items = category === "All" ? FAQ_ITEMS : FAQ_ITEMS.filter((item) => item.category === category);

  const pickCategory = (next: FaqCategory) => {
    setCategory(next);
    setOpen(0);
  };

  return (
    <SiteShell active='/faq' footerCopyright={COPYRIGHT.location} footerLinks={["home", "about", "reviews", "guest"]}>
      <PageHero
        eyebrow='FAQ'
        title='Questions people actually ask.'
        lead={`If something isn't here, the answer is probably "not yet, but it's on the list."`}
        sectionClass='max-w-[900px] px-[clamp(20px,4vw,48px)] pb-[clamp(24px,3vw,40px)] pt-[clamp(48px,7vw,96px)]'
        titleClass='text-[clamp(38px,5.6vw,62px)]'
        leadClass='mb-[26px] max-w-[36em]'
      >
        <div className='flex flex-wrap gap-2'>
          {FAQ_CATEGORIES.map((name) => {
            const on = category === name;
            return (
              <button
                key={name}
                type='button'
                aria-pressed={on}
                onClick={() => pickCategory(name)}
                className={`cursor-pointer rounded-full border px-4 py-[9px] text-[13px] font-semibold ${
                  on
                    ? "border-[rgba(251,191,36,.45)] bg-[rgba(251,191,36,.12)] text-[#fcd34d]"
                    : "border-white/[.1] bg-white/[.03] text-[#94a3b8]"
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      </PageHero>

      <section className='relative z-[1] mx-auto box-content flex max-w-[900px] flex-col gap-[10px] px-[clamp(20px,4vw,48px)] pb-[clamp(48px,6vw,80px)]'>
        {items.map((item, index) => {
          const isOpen = open === index;
          return (
            <motion.div
              key={item.question}
              initial={{ opacity: 0, y: distance }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 + index * 0.055, ease: EASE }}
              className='overflow-hidden rounded-2xl border border-white/[.07] bg-[rgba(15,23,42,.45)]'
            >
              <button
                type='button'
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? -1 : index)}
                className='flex w-full cursor-pointer items-start justify-between gap-4 px-5 py-[18px] text-left text-[#f8fafc]'
              >
                <span className='flex min-w-0 flex-col gap-[5px]'>
                  <span className='font-mono text-[9px] uppercase tracking-[.18em] text-[#64748b]'>
                    {item.category}
                  </span>
                  <span className='text-base font-bold leading-[1.4]'>{item.question}</span>
                </span>
                <span
                  className={`flex size-6 flex-none items-center justify-center rounded-lg bg-[rgba(251,191,36,.1)] text-base font-semibold text-[#fbbf24] transition-transform duration-[250ms] ease-[cubic-bezier(.16,1,.3,1)] ${
                    isOpen ? "rotate-45" : "rotate-0"
                  }`}
                >
                  +
                </span>
              </button>
              <div
                className={`overflow-hidden [transition:max-height_.32s_cubic-bezier(.16,1,.3,1),opacity_.25s] ${
                  isOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <p className='box-content max-w-[44em] px-5 pb-5 text-[15px] leading-[1.75] text-[#94a3b8]'>{item.answer}</p>
              </div>
            </motion.div>
          );
        })}
      </section>

      <CtaSection
        size='sm'
        title='Still stuck on something?'
        body='The how-to guide walks through each screen step by step.'
        primary={{ href: "/how-to", label: "Read the how-to" }}
        secondary={{ href: "/register", label: "Start free" }}
      />
    </SiteShell>
  );
};

export default FaqComponent;
