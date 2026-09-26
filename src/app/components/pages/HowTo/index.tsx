"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CtaSection } from "../../shared/Site/CtaSection";
import { PageHero } from "../../shared/Site/PageHero";
import { Reveal } from "../../shared/Site/Reveal";
import { COPYRIGHT } from "../../shared/Site/SiteFooter";
import { SiteShell } from "../../shared/Site/SiteShell";
import { EASE } from "../../shared/Site/motion";
import { GUIDES } from "./guides";

const pad = (n: number) => String(n).padStart(2, "0");

const HowToComponent = () => {
  const [active, setActive] = useState(0);
  // The first guide waits for the panel to appear; later ones swap in straight away.
  const [picked, setPicked] = useState(false);
  const guide = GUIDES[active];

  // Deep links such as /how-to#save-to-home-screen open that guide.
  useEffect(() => {
    const index = GUIDES.findIndex((g) => `#${g.id}` === window.location.hash);
    if (index >= 0) setActive(index);
  }, []);

  const pick = (index: number) => {
    setActive(index);
    setPicked(true);
  };

  return (
    <SiteShell active='/how-to' footerCopyright={COPYRIGHT.location} footerLinks={["home", "about", "reviews", "guest"]}>
      <PageHero
        eyebrow='How to'
        title='Every screen, walked through once.'
        lead='Seven short guides. Pick one on the left and the steps show up beside it.'
        sectionClass='max-w-[1100px] px-[clamp(20px,4vw,48px)] pb-[clamp(24px,3vw,40px)] pt-[clamp(48px,7vw,96px)]'
        titleClass='max-w-[16em] text-[clamp(38px,5.6vw,62px)]'
        leadClass='max-w-[36em]'
      />

      <section className='relative z-[1] mx-auto box-content grid max-w-[1100px] grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] items-start gap-[clamp(20px,3vw,32px)] px-[clamp(20px,4vw,48px)] pb-[clamp(48px,6vw,88px)]'>
        <Reveal distance={24} className='flex min-w-0 flex-col gap-2'>
          {GUIDES.map((item, index) => {
            const on = index === active;
            return (
              <button
                key={item.id}
                type='button'
                onClick={() => pick(index)}
                aria-current={on}
                className={`flex w-full cursor-pointer items-center gap-[14px] rounded-[14px] border px-4 py-[14px] text-left text-[#f8fafc] transition-[border-color,background-color] duration-200 ${
                  on
                    ? "border-[rgba(251,191,36,.45)] bg-[rgba(251,191,36,.08)]"
                    : "border-white/[.07] bg-[rgba(15,23,42,.45)]"
                }`}
              >
                <span
                  className={`flex size-[30px] flex-none items-center justify-center rounded-[9px] bg-[rgba(2,6,23,.6)] font-mono text-xs font-semibold ${
                    on ? "text-[#fbbf24]" : "text-[#64748b]"
                  }`}
                >
                  {pad(index + 1)}
                </span>
                <span className='flex min-w-0 flex-col gap-[3px]'>
                  <span className='text-[15px] font-bold'>{item.title}</span>
                  <span className='text-xs text-[#94a3b8]'>{item.blurb}</span>
                </span>
              </button>
            );
          })}
        </Reveal>

        <Reveal
          distance={24}
          className='min-w-0 rounded-[20px] border border-white/[.08] bg-[rgba(15,23,42,.55)] p-[clamp(22px,3vw,32px)]'
        >
          <p className='mb-[6px] font-mono text-[10px] uppercase tracking-[.2em] text-[#fbbf24]'>Guide {pad(active + 1)}</p>
          <h2 className='mb-2 text-[clamp(22px,2.6vw,30px)] font-extrabold tracking-[-.025em]'>{guide.title}</h2>
          <p className='mb-6 text-[15px] leading-[1.7] text-[#94a3b8]'>{guide.blurb}</p>
          <div key={guide.id} className='flex flex-col gap-3'>
            {guide.steps.map((text, index) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: (picked ? 0 : 0.3) + index * 0.07, ease: EASE }}
                className='flex items-start gap-[14px]'
              >
                <span className='mt-px flex size-[26px] flex-none items-center justify-center rounded-full border border-[rgba(251,191,36,.3)] bg-[rgba(251,191,36,.12)] font-mono text-[11px] font-semibold text-[#fbbf24]'>
                  {index + 1}
                </span>
                <p className='text-[15px] leading-[1.7] text-[#cbd5e1]'>{text}</p>
              </motion.div>
            ))}
          </div>
        </Reveal>
      </section>

      <CtaSection
        size='sm'
        title="That's the whole manual."
        body='Anything else, the FAQ probably covers it.'
        primary={{ href: "/register", label: "Start free" }}
        secondary={{ href: "/faq", label: "Read the FAQ" }}
      />
    </SiteShell>
  );
};

export default HowToComponent;
