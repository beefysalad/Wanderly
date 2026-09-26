import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

interface CtaLink {
  href: string;
  label: string;
}

interface CtaSectionProps {
  title: ReactNode;
  body: ReactNode;
  primary: CtaLink;
  secondary: CtaLink;
  /** "lg" closes a page; "sm" is the tighter version used on FAQ and How to. */
  size?: "lg" | "sm";
  /** Draw a rule above the section (About follows a tinted band, so it skips it). */
  bordered?: boolean;
}

export function CtaSection({ title, body, primary, secondary, size = "lg", bordered = true }: CtaSectionProps) {
  const lg = size === "lg";

  return (
    <section
      className={`relative z-[1] px-[clamp(20px,4vw,48px)] text-center ${bordered ? "border-t border-white/[.06]" : ""} ${
        lg ? "py-[clamp(56px,7vw,104px)]" : "py-[clamp(48px,6vw,88px)]"
      }`}
    >
      <div className={`mx-auto ${lg ? "max-w-[700px]" : "max-w-[640px]"}`}>
        <Reveal distance={24}>
          <h2
            className={
              lg
                ? "mb-4 text-[clamp(30px,4.4vw,52px)] font-extrabold leading-[1.05] tracking-[-.035em]"
                : "mb-[14px] text-[clamp(26px,3.6vw,42px)] font-extrabold tracking-[-.03em]"
            }
          >
            {title}
          </h2>
        </Reveal>
        <Reveal distance={24}>
          <p className={lg ? "mb-7 text-[17px] text-[#94a3b8]" : "mb-[26px] text-base text-[#94a3b8]"}>{body}</p>
        </Reveal>
        <Reveal distance={24} className='flex flex-wrap justify-center gap-3'>
          <Link
            href={primary.href}
            className={`inline-flex items-center gap-[10px] rounded-full bg-[linear-gradient(100deg,#fbbf24,#f97316)] font-extrabold text-[#160c02] ${
              lg
                ? "px-8 py-[17px] text-[17px] shadow-[0_22px_50px_-20px_rgba(251,146,60,.95)]"
                : "px-[30px] py-4 text-base shadow-[0_20px_44px_-20px_rgba(251,146,60,.9)]"
            }`}
          >
            {primary.label} <ArrowRight className={lg ? "size-[18px]" : "size-[17px]"} />
          </Link>
          <Link
            href={secondary.href}
            className={`inline-flex items-center gap-[10px] rounded-full border border-white/[.14] bg-white/[.03] font-semibold text-[#e2e8f0] ${
              lg ? "px-7 py-[17px] text-[17px]" : "px-[26px] py-4 text-base"
            }`}
          >
            {secondary.label}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
