import { ArrowRight, Plane, Users } from "lucide-react";

interface ActionStepProps {
  handleCompleteOnboarding: (nextAction?: "CREATE_GROUP" | "JOIN_GROUP") => void;
  isSubmitting: boolean;
}

const CODE_PREVIEW = ["7", "X", "K", "", "", ""];

export function ActionStep({ handleCompleteOnboarding, isSubmitting }: ActionStepProps) {
  return (
    <div className='mx-auto flex w-full max-w-[960px] flex-col gap-7'>
      <div>
        <p className='mb-[10px] font-mono text-[10px] uppercase tracking-[.18em] text-[#64748b]'>Last step</p>
        <h2 className='mb-2 text-[clamp(30px,5cqw,40px)] font-extrabold leading-[1.05] tracking-[-.03em]'>
          You&apos;re all set. <span className='text-[#fbbf24]'>Where to?</span>
        </h2>
        <p className='text-base text-[#94a3b8]'>
          Start a group of your own, or hop into one your friends already made.
        </p>
      </div>

      <div className='grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-[14px]'>
        <button
          type='button'
          disabled={isSubmitting}
          onClick={() => handleCompleteOnboarding("CREATE_GROUP")}
          className='flex cursor-pointer flex-col gap-[26px] rounded-3xl border border-[rgba(245,158,11,.28)] bg-[rgba(245,158,11,.07)] p-[clamp(20px,3cqw,28px)] text-left text-[#f8fafc] hover:border-[rgba(251,191,36,.6)] disabled:cursor-not-allowed disabled:opacity-60'
        >
          <span className='flex size-[52px] items-center justify-center rounded-2xl bg-[linear-gradient(100deg,#fbbf24,#f97316)] text-[#160c02]'>
            <Plane className='size-6' />
          </span>
          <span className='flex flex-col gap-2'>
            <span className='text-[26px] font-extrabold tracking-[-.02em]'>Plan a trip</span>
            <span className='text-[15px] leading-[1.55] text-[#cbd5e1]'>
              Create a new group and start your adventure from scratch.
            </span>
          </span>
          <span className='flex items-center gap-2 text-sm font-bold text-[#fbbf24]'>
            Create a group <ArrowRight className='size-4' />
          </span>
        </button>

        <button
          type='button'
          disabled={isSubmitting}
          onClick={() => handleCompleteOnboarding("JOIN_GROUP")}
          className='flex cursor-pointer flex-col gap-[26px] rounded-3xl border border-white/[.1] bg-[rgba(15,23,42,.6)] p-[clamp(20px,3cqw,28px)] text-left text-[#f8fafc] hover:border-white/[.22] disabled:cursor-not-allowed disabled:opacity-60'
        >
          <span className='flex size-[52px] items-center justify-center rounded-2xl border border-white/[.1] bg-white/[.06] text-[#e2e8f0]'>
            <Users className='size-6' />
          </span>
          <span className='flex flex-col gap-2'>
            <span className='text-[26px] font-extrabold tracking-[-.02em]'>Join a crew</span>
            <span className='text-[15px] leading-[1.55] text-[#cbd5e1]'>
              Have a code? Enter it to join an existing trip instantly.
            </span>
          </span>
          <span className='flex items-center gap-[10px]'>
            <span className='flex gap-1'>
              {CODE_PREVIEW.map((char, index) => (
                <span
                  key={index}
                  className='flex h-7 w-[22px] items-center justify-center rounded-md border border-white/[.12] bg-[rgba(2,6,23,.6)] font-mono text-xs text-[#fbbf24]'
                >
                  {char}
                </span>
              ))}
            </span>
            <span className='text-sm font-bold text-[#e2e8f0]'>Enter code</span>
          </span>
        </button>
      </div>

      <button
        type='button'
        disabled={isSubmitting}
        onClick={() => handleCompleteOnboarding()}
        className='cursor-pointer self-center text-sm font-semibold text-[#94a3b8] hover:text-[#e2e8f0] disabled:cursor-not-allowed disabled:opacity-60'
      >
        Look around the sample trip first
      </button>
    </div>
  );
}
