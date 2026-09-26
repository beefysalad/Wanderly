import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const ASKS = [
  "A photo and your bucket-list pick",
  "How you like to travel",
  "Who you usually go with",
  "Plan a trip, or join your crew's",
];

interface WelcomeStepProps {
  firstName: string;
  onBegin: () => void;
}

export function WelcomeStep({ firstName, onBegin }: WelcomeStepProps) {
  return (
    <div className='mx-auto grid w-full max-w-[1080px] grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] items-center gap-[clamp(32px,6cqw,72px)]'>
      <div className='min-w-0'>
        <p className='mb-[18px] font-mono text-[11px] uppercase tracking-[.18em] text-[#64748b]'>
          Hey {firstName}, you&apos;re in
        </p>
        <h1 className='mb-[22px] text-balance text-[clamp(42px,6.4cqw,76px)] font-extrabold leading-[.98] tracking-[-.035em]'>
          Welcome to Wanderly.
          <span className='block text-[#fbbf24]'>Let&apos;s set you up.</span>
        </h1>
        <p className='mb-8 max-w-[30em] text-[clamp(16px,2cqw,19px)] leading-[1.65] text-[#94a3b8]'>
          Let&apos;s personalize your journey. We&apos;ll help you plan, split costs, and travel better.
        </p>
        <div className='mb-[22px] flex flex-wrap gap-3'>
          <button
            type='button'
            onClick={onBegin}
            className='inline-flex cursor-pointer items-center gap-[10px] rounded-full bg-[linear-gradient(100deg,#fbbf24,#f97316)] px-7 py-4 text-[17px] font-extrabold text-[#160c02] shadow-[0_18px_40px_-18px_rgba(251,146,60,.9)]'
          >
            Begin journey <ArrowRight className='size-[18px]' strokeWidth={2.4} />
          </button>
        </div>
        <p className='flex items-center gap-[10px] font-mono text-xs tracking-[.04em] text-[#64748b]'>
          <Check className='size-[14px] text-[#34d399]' strokeWidth={2.4} />
          About a minute · you can change all of it later
        </p>
      </div>

      <div className='overflow-hidden rounded-[26px] border border-white/[.09] bg-[linear-gradient(180deg,rgba(15,23,42,.92),rgba(2,6,23,.92))] shadow-[0_60px_120px_-50px_rgba(0,0,0,.9)]'>
        <div className='border-b border-white/[.06] px-[18px] py-4'>
          <p className='font-mono text-[10px] uppercase tracking-[.18em] text-[#64748b]'>What we&apos;ll ask</p>
          <p className='mt-[3px] text-[17px] font-bold'>Four quick things</p>
        </div>
        <div className='flex flex-col gap-[10px] p-[14px]'>
          {ASKS.map((ask, index) => (
            <div
              key={ask}
              className={cn(
                "flex items-center gap-3 rounded-[14px] border bg-[rgba(30,41,59,.4)] px-[14px] py-[13px]",
                index === 0 ? "border-[rgba(249,115,22,.28)]" : "border-white/[.05]",
              )}
            >
              <span
                className={cn(
                  "flex-none rounded-md bg-[rgba(2,6,23,.6)] px-2 py-1 font-mono text-[11px]",
                  index === 0 ? "text-[#fbbf24]" : "text-[#cbd5e1]",
                )}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className='text-sm font-semibold text-[#e2e8f0]'>{ask}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
