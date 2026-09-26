"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { CtaSection } from "../../shared/Site/CtaSection";
import { EYEBROW, PageHero } from "../../shared/Site/PageHero";
import { COPYRIGHT } from "../../shared/Site/SiteFooter";
import { SiteShell } from "../../shared/Site/SiteShell";
import { EASE, useRevealDistance } from "../../shared/Site/motion";
import { CalendarMock, CodeMock, TabMock } from "./mocks";

interface FeatureRowProps {
  index: number;
  children: ReactNode;
}

/** One feature: the two halves slide in from alternating sides as the row scrolls into view. */
function FeatureRow({ index, children }: FeatureRowProps) {
  const distance = useRevealDistance(24);
  const side = distance === 0 ? 0 : index % 2 === 0 ? -28 : 28;

  return (
    <motion.div
      initial={{ opacity: 0, x: side, y: distance }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -15% 0px" }}
      transition={{ duration: 0.85, ease: EASE }}
      className='grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] items-center gap-[clamp(28px,4vw,64px)]'
    >
      {children}
    </motion.div>
  );
}

function Bullets({ items, className = "" }: { items: string[]; className?: string }) {
  return (
    <ul className={`flex flex-col gap-[10px] text-sm text-[#cbd5e1] ${className}`}>
      {items.map((item) => (
        <li key={item} className='flex items-center gap-[10px]'>
          <Check className='size-[15px] flex-none text-[#fbbf24]' />
          {item}
        </li>
      ))}
    </ul>
  );
}

const HEADING = "mb-[14px] text-[clamp(26px,3vw,38px)] font-extrabold tracking-[-.025em]";
const BODY = "mb-5 max-w-[34em] text-base leading-[1.7] text-[#94a3b8]";

const FeaturesComponent = () => {
  return (
    <SiteShell active='/features' footerCopyright={COPYRIGHT.rights} footerLinks={["home", "howItWorks", "about", "faq", "reviews", "guest"]}>
      <PageHero
        eyebrow='Features'
        title='Three things, done properly.'
        lead='A shared schedule, a running tab, and a code that lets anyone in. Everything else Wanderly does is in service of those three.'
        sectionClass='max-w-[1240px] px-[clamp(20px,4vw,48px)] pb-[clamp(32px,4vw,56px)] pt-[clamp(48px,7vw,96px)]'
        titleClass='max-w-[14em] text-[clamp(38px,5.6vw,68px)]'
        leadClass='max-w-[36em]'
      />

      <section className='relative z-[1] mx-auto box-content flex max-w-[1240px] flex-col gap-[clamp(48px,7vw,96px)] px-[clamp(20px,4vw,48px)] pb-[clamp(56px,7vw,96px)]'>
        <FeatureRow index={0}>
          <div className='min-w-0'>
            <p className={`mb-3 ${EYEBROW}`}>One schedule</p>
            <h2 className={HEADING}>Everybody&apos;s looking at the same day.</h2>
            <p className={BODY}>
              Calendar view for the shape of the trip, schedule view for the hour-by-hour. Tick things off as they
              happen, and export the lot to Google, Apple or Outlook so it&apos;s on everyone&apos;s phone.
            </p>
            <Bullets
              items={[
                "Drag to reorder a day in seconds",
                "Pickup and drop-off points on each activity",
                "Export as .ics or a shareable PNG",
              ]}
            />
          </div>
          <CalendarMock />
        </FeatureRow>

        <FeatureRow index={1}>
          <TabMock />
          <div className='order-1 min-w-0'>
            <p className={`mb-3 ${EYEBROW}`}>One running tab</p>
            <h2 className={HEADING}>Nobody has to be the spreadsheet guy.</h2>
            <p className={BODY}>
              Log an expense, pick who it&apos;s split between, and Wanderly keeps the running balance. Attach your
              GCash or Maya QR so people can pay you back without asking for it twice.
            </p>
            <Bullets
              items={[
                "Categories: stay, food, transport, activities",
                "Mark payments received, with a full log",
                "Cash, bank, Maya or GCash QR",
              ]}
            />
          </div>
        </FeatureRow>

        <FeatureRow index={2}>
          <div className='min-w-0'>
            <p className={`mb-3 ${EYEBROW}`}>One link</p>
            <h2 className={HEADING}>Your friend who never signs up? Still covered.</h2>
            <p className={BODY}>
              Send the code and they get a read-only view of the trip — schedule, activities, what they owe — with no
              account and no nagging. Emails stay blurred, updates land on their screen as you make them.
            </p>
            <Bullets
              className='mb-[22px]'
              items={[
                "Read-only guest mode via group code",
                "Live updates, no refresh ritual",
                "Private by default — no emails on show",
              ]}
            />
            <Link
              href='/guest/join'
              className='inline-flex items-center gap-2 text-[15px] font-semibold text-[#fbbf24]'
            >
              Try guest mode <ArrowRight className='size-[15px]' />
            </Link>
          </div>
          <CodeMock />
        </FeatureRow>
      </section>

      <CtaSection
        title='Ready when your group is.'
        body='Two minutes to your first trip. No card, no trial timer.'
        primary={{ href: "/register", label: "Start free" }}
        secondary={{ href: "/how-it-works", label: "See how it works" }}
      />
    </SiteShell>
  );
};

export default FeaturesComponent;
