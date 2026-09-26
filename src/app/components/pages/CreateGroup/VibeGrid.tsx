import { cn } from "@/lib/utils";
import { VIBES } from "@/lib/utils/groupColors";
import { getGroupTheme } from "@/lib/utils/groupTheme";
import { FIELD_LABEL } from "../../shared/formStyles";

interface VibeGridProps {
  value: string;
  onChange: (key: string) => void;
}

/** The ten group vibes as selectable tiles. */
export function VibeGrid({ value, onChange }: VibeGridProps) {
  return (
    <div className='flex flex-col gap-[9px]'>
      <span className={FIELD_LABEL}>Choose the vibe</span>
      <div className='grid grid-cols-[repeat(auto-fill,minmax(min(150px,100%),1fr))] gap-2'>
        {Object.entries(VIBES).map(([key, vibe]) => {
          const selected = value === key;
          return (
            <button
              key={key}
              type='button'
              onClick={() => onChange(key)}
              aria-pressed={selected}
              className={cn(
                "flex cursor-pointer flex-col gap-2 rounded-2xl border p-3 text-left",
                selected
                  ? "border-[rgba(251,191,36,.55)] bg-[rgba(251,191,36,.07)]"
                  : "border-white/[.08] bg-[rgba(15,23,42,.6)] hover:border-white/[.18]",
              )}
            >
              <span
                className={cn(
                  "flex size-[34px] items-center justify-center rounded-[10px] border text-lg",
                  getGroupTheme(key).tile,
                )}
              >
                {vibe.emoji}
              </span>
              <span className='text-sm font-bold'>{vibe.name}</span>
              <span className='text-[11px] leading-[1.4] text-[#64748b]'>{vibe.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
