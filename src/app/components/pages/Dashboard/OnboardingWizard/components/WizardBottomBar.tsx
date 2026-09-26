import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { continueLabel } from "../onboardingSteps";
import type { Step } from "../onboardingOptions";

interface WizardBottomBarProps {
  step: Step;
  enabled: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onContinue: () => void;
}

export function WizardBottomBar({ step, enabled, isSubmitting, onBack, onContinue }: WizardBottomBarProps) {
  return (
    <div className='relative z-[1] flex flex-none items-center justify-between gap-3 border-t border-white/[.06] bg-[rgba(2,6,23,.72)] px-[clamp(18px,4vw,40px)] pb-[calc(env(safe-area-inset-bottom)+14px)] pt-4 backdrop-blur-[18px] md:pb-4'>
      <button
        type='button'
        onClick={onBack}
        disabled={isSubmitting}
        className='inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/[.14] bg-white/[.03] px-[18px] py-3 text-[15px] font-semibold text-[#e2e8f0] disabled:cursor-not-allowed disabled:opacity-60'
      >
        <ArrowLeft className='size-[18px]' />
        Back
      </button>
      <button
        type='button'
        onClick={onContinue}
        disabled={!enabled}
        className={cn(
          "inline-flex cursor-pointer items-center gap-[10px] rounded-full bg-[linear-gradient(100deg,#fbbf24,#f97316)] px-6 py-[13px] text-[15px] font-extrabold text-[#160c02] shadow-[0_18px_40px_-18px_rgba(251,146,60,.9)]",
          !enabled && "cursor-not-allowed opacity-[.45]",
        )}
      >
        {continueLabel(step)}
        {isSubmitting ? <Loader2 className='size-[18px] animate-spin' /> : <ArrowRight className='size-[18px]' />}
      </button>
    </div>
  );
}
