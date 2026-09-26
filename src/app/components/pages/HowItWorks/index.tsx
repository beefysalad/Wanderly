"use client";

import { motion } from "framer-motion";
import { Check, Copy, GripVertical } from "lucide-react";
import type { ReactNode } from "react";
import { CtaSection } from "../../shared/Site/CtaSection";
import { PageHero } from "../../shared/Site/PageHero";
import { COPYRIGHT } from "../../shared/Site/SiteFooter";
import { SiteShell } from "../../shared/Site/SiteShell";
import { EASE, useRevealDistance } from "../../shared/Site/motion";

const MONO_LABEL = "font-mono text-[10px] uppercase tracking-[.18em] text-[#64748b]";

interface StepProps {
  number: string;
  title: string;
  body: string;
  children: ReactNode;
}

/** One numbered step: copy on the left, a small mock of the screen on the right. */
function Step({ number, title, body, children }: StepProps) {
  const distance = useRevealDistance(24) + 12;

  return (
    <motion.div
      initial={{ opacity: 0, y: distance, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "0px 0px -14% 0px" }}
      transition={{ duration: 0.8, ease: EASE }}
      className='grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] items-center gap-[clamp(24px,3.5vw,52px)] rounded-[22px] border border-white/[.07] bg-[rgba(15,23,42,.45)] p-[clamp(24px,3vw,36px)]'
    >
      <div className='min-w-0'>
        <div className='mb-4 font-mono text-[44px] font-semibold leading-none text-[rgba(251,191,36,.28)]'>{number}</div>
        <h2 className='mb-3 text-[clamp(23px,2.6vw,32px)] font-extrabold tracking-[-.02em]'>{title}</h2>
        <p className='max-w-[32em] text-base leading-[1.7] text-[#94a3b8]'>{body}</p>
      </div>
      {children}
    </motion.div>
  );
}

const SCHEDULE = [
  { time: "6:30 AM", title: "🚐 Pickup at hostel", picked: false },
  { time: "9:00 AM", title: "⛵ Naked Island", picked: true },
  { time: "12:30 PM", title: "🍽️ Lunch — Guyam", picked: false },
];

const HowItWorksComponent = () => {
  return (
    <SiteShell active='/how-it-works' footerCopyright={COPYRIGHT.rights} footerLinks={["home", "features", "about", "faq", "reviews", "guest"]}>
      <PageHero
        eyebrow='How it works'
        title={`From "we should go somewhere" to a plan nobody has to chase.`}
        lead="Three steps. The longest one takes about two minutes, and it's the one where you argue about dates."
        sectionClass='max-w-[1240px] px-[clamp(20px,4vw,48px)] pb-[clamp(32px,4vw,56px)] pt-[clamp(48px,7vw,96px)]'
        titleClass='max-w-[14em] text-[clamp(38px,5.6vw,68px)]'
        leadClass='max-w-[36em]'
      />

      <section className='relative z-[1] mx-auto box-content flex max-w-[1100px] flex-col gap-[clamp(28px,4vw,44px)] px-[clamp(20px,4vw,48px)] pb-[clamp(48px,6vw,88px)]'>
        <Step
          number='01'
          title='Make the group'
          body={`Name the trip, set the dates, done. You get a six-character code — that code is the entire invite system. No seat licences, no "add member" dropdown.`}
        >
          <div className='min-w-0 rounded-2xl border border-white/[.08] bg-[rgba(2,6,23,.6)] p-5'>
            <p className={`mb-[6px] ${MONO_LABEL}`}>Trip name</p>
            <p className='mb-4 text-[17px] font-bold'>Siargao, finally</p>
            <div className='flex items-center justify-between rounded-xl border border-[rgba(251,191,36,.25)] bg-[rgba(251,191,36,.08)] px-[14px] py-3'>
              <span className='font-mono text-[20px] font-semibold tracking-[.16em] text-[#fbbf24]'>7XK2QD</span>
              <Copy className='size-4 text-[#94a3b8]' />
            </div>
          </div>
        </Step>

        <Step
          number='02'
          title='Drop the plan in'
          body='Days, times, pickups, that one restaurant someone insisted on. Drag to reorder when the plan changes — and it will change, probably at 11pm the night before.'
        >
          <div className='flex min-w-0 flex-col gap-2 rounded-2xl border border-white/[.08] bg-[rgba(2,6,23,.6)] p-[14px]'>
            {SCHEDULE.map((item, index) => (
              <motion.div
                key={item.time}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "0px 0px -14% 0px" }}
                transition={{ duration: 0.5, delay: 0.25 + index * 0.1, ease: EASE }}
                className={`flex items-center gap-[10px] rounded-xl border bg-[rgba(30,41,59,.4)] p-3 ${
                  item.picked ? "border-[rgba(251,191,36,.3)]" : "border-white/[.05]"
                }`}
              >
                <GripVertical className={`size-[14px] flex-none ${item.picked ? "text-[#fbbf24]" : "text-[#475569]"}`} />
                <span className='flex-none font-mono text-[11px] text-[#cbd5e1]'>{item.time}</span>
                <span className='truncate text-sm font-semibold'>{item.title}</span>
              </motion.div>
            ))}
          </div>
        </Step>

        <Step
          number='03'
          title='Settle up, stay friends'
          body={`Log what you paid, pick who it's split between, mark it received. The math stops being anyone's job — and nobody has to send the "hey, so about the van" message.`}
        >
          <div className='min-w-0 rounded-2xl border border-white/[.08] bg-[rgba(2,6,23,.6)] p-5'>
            <div className='mb-4 flex items-end justify-between gap-4'>
              <div>
                <p className='text-[11px] text-[#94a3b8]'>You owe MJ</p>
                <p className='mt-[3px] text-[26px] font-extrabold text-[#fb923c]'>₱1,780</p>
              </div>
              <div className='text-right'>
                <p className='text-[11px] text-[#94a3b8]'>Owed to you</p>
                <p className='mt-[3px] text-[26px] font-extrabold text-[#34d399]'>₱1,920</p>
              </div>
            </div>
            <div className='flex items-center justify-center gap-2 rounded-xl border border-[rgba(52,211,153,.25)] bg-[rgba(52,211,153,.1)] p-3 text-[13px] font-semibold text-[#34d399]'>
              <Check className='size-[15px]' /> Mark as settled
            </div>
          </div>
        </Step>
      </section>

      <CtaSection
        title="That's the whole thing."
        body='Make a group, drop in the plan, split the tab. Start with the first one.'
        primary={{ href: "/register", label: "Start free" }}
        secondary={{ href: "/features", label: "See the features" }}
      />
    </SiteShell>
  );
};

export default HowItWorksComponent;
