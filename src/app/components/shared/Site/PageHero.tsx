import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

export const EYEBROW = "font-mono text-[11px] uppercase tracking-[.2em] text-[#fbbf24]";

interface PageHeroProps {
  eyebrow: string;
  title: ReactNode;
  lead: ReactNode;
  /** Full class list for the <section> (width and vertical padding differ per page). */
  sectionClass: string;
  /** Font-size and max-width classes for the <h1>. */
  titleClass: string;
  /** Max-width (and bottom margin, if any) classes for the lead paragraph. */
  leadClass: string;
  /** Extra intro content, revealed after the lead (e.g. the FAQ filter chips). */
  children?: ReactNode;
}

/** Eyebrow, headline and lead that open every inner page, revealed one after the other. */
export function PageHero({ eyebrow, title, lead, sectionClass, titleClass, leadClass, children }: PageHeroProps) {
  return (
    <section className={`relative z-[1] mx-auto box-content ${sectionClass}`}>
      <Reveal immediate distance={24} delay={0.05}>
        <p className={`mb-[14px] ${EYEBROW}`}>{eyebrow}</p>
      </Reveal>
      <Reveal immediate distance={24} delay={0.14}>
        <h1 className={`mb-[18px] font-extrabold leading-[1.02] tracking-[-.035em] ${titleClass}`}>{title}</h1>
      </Reveal>
      <Reveal immediate distance={24} delay={0.23}>
        <p className={`text-[17px] leading-[1.7] text-[#94a3b8] ${leadClass}`}>{lead}</p>
      </Reveal>
      {children ? (
        <Reveal immediate distance={24} delay={0.32}>
          {children}
        </Reveal>
      ) : null}
    </section>
  );
}
