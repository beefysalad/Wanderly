import { LogOut } from "lucide-react";

interface TravelDnaProps {
  vibes: string[];
  crew: string | null;
  bucketList: string | null;
  onSignOut: () => void;
}

const ROW = "flex justify-between gap-[10px] border-t border-white/[.06] pt-3 text-sm";

/** What onboarding learned about the traveller, plus the Sign out button. */
export function TravelDna({ vibes, crew, bucketList, onSignOut }: TravelDnaProps) {
  return (
    <div className='flex min-w-0 flex-[1_1_280px] flex-col gap-[14px] rounded-[22px] border border-white/[.08] bg-[rgba(15,23,42,.6)] p-[18px]'>
      <span className='font-mono text-[10px] uppercase tracking-[.16em] text-[#64748b]'>Travel DNA</span>

      <div className='flex flex-col gap-[6px]'>
        <span className='text-xs text-[#94a3b8]'>Vibe</span>
        {vibes.length > 0 ? (
          <div className='flex flex-wrap gap-[6px]'>
            {vibes.map((vibe) => (
              <span
                key={vibe}
                className='rounded-full border border-[rgba(251,191,36,.35)] bg-[rgba(251,191,36,.08)] px-[11px] py-[5px] text-[13px] font-semibold text-[#fbbf24]'
              >
                {vibe}
              </span>
            ))}
          </div>
        ) : (
          <span className='text-sm text-[#64748b]'>Not set yet</span>
        )}
      </div>

      <div className={ROW}>
        <span className='text-[#94a3b8]'>Crew</span>
        <span className='text-right font-semibold'>{crew ?? "—"}</span>
      </div>
      <div className={ROW}>
        <span className='text-[#94a3b8]'>Bucket list</span>
        <span className='text-right font-semibold'>{bucketList ?? "—"}</span>
      </div>

      <button
        type='button'
        onClick={onSignOut}
        className='mt-[6px] flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[rgba(248,113,113,.25)] bg-[rgba(248,113,113,.06)] p-[11px] text-sm font-semibold text-[#f87171]'
      >
        <LogOut className='size-4' />
        Sign out
      </button>
    </div>
  );
}
