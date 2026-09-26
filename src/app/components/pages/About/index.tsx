"use client";

import { Calendar, Users, Wallet, type LucideIcon } from "lucide-react";
import { CtaSection } from "../../shared/Site/CtaSection";
import { EYEBROW, PageHero } from "../../shared/Site/PageHero";
import { Reveal } from "../../shared/Site/Reveal";
import { COPYRIGHT } from "../../shared/Site/SiteFooter";
import { SiteShell } from "../../shared/Site/SiteShell";
import { StaggerGroup, StaggerItem } from "../../shared/Site/Stagger";

const CARD = "h-full rounded-[20px] border px-6 py-[26px]";

const STORY = [
  {
    label: "The problem",
    body: "Group trip planning gets fragmented fast. Info disappears, tasks get duplicated, and money tracking turns into guesswork.",
  },
  {
    label: "The approach",
    body: "Keep it simple: one itinerary, one expense ledger, and one space where every member can contribute without friction.",
  },
];

const HELPS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Calendar,
    title: "Scheduling",
    body: "One timeline everyone can see, so changes land before someone books the wrong boat.",
  },
  {
    icon: Wallet,
    title: "Expense clarity",
    body: "Who paid, who owes, what's settled — without chasing screenshots through a chat thread.",
  },
  {
    icon: Users,
    title: "Group ownership",
    body: "Anyone can update the plan, so the trip stops depending on one exhausted organiser.",
  },
];

const AboutComponent = () => {
  return (
    <SiteShell active='/about' footerCopyright={COPYRIGHT.location} footerLinks={["home", "howTo", "faq", "reviews", "guest"]}>
      <PageHero
        eyebrow='About Wanderly'
        title='Built to make group trips actually enjoyable.'
        lead='Wanderly replaces scattered chats, stale spreadsheets and payment confusion with one clear place to plan, decide and travel together.'
        sectionClass='max-w-[1100px] px-[clamp(20px,4vw,48px)] pb-[clamp(32px,4vw,56px)] pt-[clamp(48px,7vw,96px)]'
        titleClass='max-w-[16em] text-[clamp(38px,5.6vw,66px)]'
        leadClass='max-w-[38em]'
      />

      <StaggerGroup className='relative z-[1] mx-auto box-content grid max-w-[1100px] grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[clamp(16px,2.4vw,24px)] px-[clamp(20px,4vw,48px)] pb-[clamp(48px,6vw,80px)]'>
        {STORY.map((item) => (
          <StaggerItem key={item.label}>
            <div className={`${CARD} border-white/[.07] bg-[rgba(15,23,42,.45)]`}>
              <p className='mb-3 font-mono text-[10px] uppercase tracking-[.2em] text-[#64748b]'>{item.label}</p>
              <p className='text-[15px] leading-[1.7] text-[#cbd5e1]'>{item.body}</p>
            </div>
          </StaggerItem>
        ))}
        <StaggerItem>
          <div className={`${CARD} border-[rgba(251,191,36,.28)] bg-[rgba(251,191,36,.07)]`}>
            <p className='mb-3 font-mono text-[10px] uppercase tracking-[.2em] text-[#fcd34d]'>The goal</p>
            <p className='text-[15px] leading-[1.7] text-[#fde9bd]'>
              Spend less time coordinating and more time travelling. That&apos;s the product standard behind every
              feature here.
            </p>
          </div>
        </StaggerItem>
      </StaggerGroup>

      <section className='relative z-[1] mx-auto box-content max-w-[1100px] px-[clamp(20px,4vw,48px)] pb-[clamp(48px,6vw,80px)]'>
        <Reveal distance={24}>
          <h2 className='mb-[clamp(24px,3vw,36px)] text-[clamp(26px,3.4vw,40px)] font-extrabold tracking-[-.03em]'>
            What Wanderly helps you do
          </h2>
        </Reveal>
        <StaggerGroup className='grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-[clamp(16px,2.4vw,24px)]'>
          {HELPS.map(({ icon: Icon, title, body }) => (
            <StaggerItem key={title}>
              <div className={`${CARD} border-white/[.07] bg-[rgba(15,23,42,.45)]`}>
                <Icon className='size-[22px] text-[#fbbf24]' />
                <h3 className='mb-2 mt-4 text-[19px] font-bold'>{title}</h3>
                <p className='text-[15px] leading-[1.65] text-[#94a3b8]'>{body}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>

      <section className='relative z-[1] border-t border-white/[.06] bg-[rgba(15,23,42,.35)] px-[clamp(20px,4vw,48px)] py-[clamp(48px,6vw,88px)]'>
        <Reveal distance={24} className='mx-auto max-w-[760px]'>
          <p className={`mb-3 ${EYEBROW}`}>Builder note</p>
          <h2 className='mb-4 text-[clamp(26px,3.4vw,40px)] font-extrabold tracking-[-.03em]'>
            Built with a strict no-bloat rule.
          </h2>
          <p className='text-base leading-[1.75] text-[#94a3b8]'>
            Wanderly exists because trip planning tools usually feel overloaded or generic. The direction is simple:
            solve planning and money coordination cleanly, then get out of your way. It&apos;s in beta and free while
            the features are still being shaped with early users.
          </p>
        </Reveal>
      </section>

      <CtaSection
        bordered={false}
        title='Plan less. Travel more.'
        body="Free while it's in beta. No card, no trial timer."
        primary={{ href: "/register", label: "Start free" }}
        secondary={{ href: "/faq", label: "Read the FAQ" }}
      />
    </SiteShell>
  );
};

export default AboutComponent;
