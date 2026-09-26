import Image from "next/image";
import { cn } from "@/lib/utils";
import { STEP_ORDER, stepNumber } from "../onboardingSteps";
import type { Step } from "../onboardingOptions";

/** Logo on the left; "Step N of 6" and one progress segment per step on the right. */
export function WizardTopBar({ step }: { step: Step }) {
  const current = stepNumber(step);

  return (
    <div className='relative z-[1] flex items-center justify-between gap-4 border-b border-white/[.06] px-[clamp(18px,4vw,40px)] py-[18px]'>
      <div className='flex items-center gap-[10px]'>
        <Image src='/wanderly.png' alt='' width={28} height={28} className='size-7 object-contain' />
        <span className='text-[17px] font-extrabold tracking-[-.02em]'>Wanderly</span>
      </div>
      <div className='flex items-center gap-[10px]'>
        <span className='whitespace-nowrap font-mono text-[10px] uppercase tracking-[.14em] text-[#94a3b8]'>
          Step {current} of {STEP_ORDER.length}
        </span>
        <div className='flex gap-[3px]' aria-hidden>
          {STEP_ORDER.map((name, index) => (
            <span
              key={name}
              className={cn(
                "h-1 w-[clamp(10px,2vw,18px)] rounded",
                index < current ? "bg-[#fbbf24]" : "bg-white/[.1]",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
