import { cn } from "@/lib/utils";
import type { Group } from "@/src/shared/types";
import { profileStats } from "../profileView";

/** Groups · Destinations · Activities · Trips, in one bordered strip. */
export function ProfileStats({ groups }: { groups: Group[] }) {
  return (
    <div className='grid grid-cols-4 rounded-[18px] border border-white/[.08] bg-[rgba(15,23,42,.6)]'>
      {profileStats(groups).map((stat, index) => (
        <div
          key={stat.label}
          className={cn(
            "flex min-w-0 flex-col gap-1 px-[clamp(10px,2cqw,18px)] py-[14px]",
            index > 0 && "border-l border-white/[.08]",
          )}
        >
          <span className='truncate font-mono text-[9px] uppercase tracking-[.12em] text-[#64748b]'>{stat.label}</span>
          <span className='text-2xl font-extrabold tabular-nums'>{stat.value}</span>
        </div>
      ))}
    </div>
  );
}
