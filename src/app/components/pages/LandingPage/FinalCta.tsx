import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Reveal } from "./Reveal";

export function FinalCta() {
  return (
    <section className='relative z-[1] px-[clamp(20px,4vw,48px)] py-[clamp(72px,9vw,128px)] text-center'>
      <div className='mx-auto max-w-[760px]'>
        <Reveal>
          <h2 className='mb-[18px] text-[clamp(34px,5.4vw,64px)] font-extrabold leading-[1.02] tracking-[-.035em]'>
            Someone has to plan it.
            <br />
            <span className='text-[#fbbf24]'>Might as well be easy.</span>
          </h2>
        </Reveal>
        <Reveal>
          <p className='mb-[30px] text-[17px] leading-[1.65] text-[#94a3b8]'>
            Set up your first trip in about two minutes. No card, no trial timer, no upsell email at 9am.
          </p>
        </Reveal>
        <Reveal className='flex flex-wrap justify-center gap-3'>
          <Link
            href='/register'
            className='inline-flex items-center gap-[10px] rounded-full bg-[linear-gradient(100deg,#fbbf24,#f97316)] px-8 py-[17px] text-[17px] font-extrabold text-[#160c02] shadow-[0_22px_50px_-20px_rgba(251,146,60,.95)]'
          >
            Start free <ArrowRight className='size-[18px]' />
          </Link>
          <Link
            href='/guest/join'
            className='inline-flex items-center gap-[10px] rounded-full border border-white/[.14] bg-white/[.03] px-7 py-[17px] text-[17px] font-semibold text-[#e2e8f0]'
          >
            Join with a code
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
