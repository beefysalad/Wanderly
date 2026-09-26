import { cn } from "@/lib/utils";
import type { ExpenseFormStep } from "../steps";

interface IStepperProps {
  steps: ExpenseFormStep[];
  currentStep: number;
  /** Jump back to a step that's already done. */
  onGoTo: (step: number) => void;
}

/** Three steps along the top: a bar, a number (a tick once done) and what the step is for. */
export const Stepper = ({ steps, currentStep, onGoTo }: IStepperProps) => {
  return (
    <div className='grid grid-cols-3 gap-2'>
      {steps.map((step) => {
        const done = step.number < currentStep;
        const active = step.number === currentStep;
        return (
          <button
            key={step.number}
            type='button'
            disabled={!done}
            onClick={() => onGoTo(step.number)}
            className={cn(
              "flex items-center gap-[10px] border-t-2 pt-[10px] text-left disabled:cursor-default",
              step.number <= currentStep ? "border-[#fbbf24]" : "border-white/[.08]",
              done && "cursor-pointer",
            )}
          >
            <span
              className={cn(
                "flex size-6 flex-none items-center justify-center rounded-full text-xs font-extrabold",
                done ? "bg-[#34d399] text-[#160c02]" : active ? "bg-[#fbbf24] text-[#160c02]" : "bg-white/[.06] text-[#64748b]",
              )}
            >
              {done ? "✓" : step.number}
            </span>
            <span className='flex min-w-0 flex-col gap-[1px]'>
              <span className={cn("text-sm font-bold", active ? "text-[#f8fafc]" : "text-[#94a3b8]")}>{step.title}</span>
              <span className='truncate text-[11px] text-[#64748b]'>{step.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
};
