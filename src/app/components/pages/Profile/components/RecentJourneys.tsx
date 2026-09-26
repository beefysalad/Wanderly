import Link from "next/link";
import { cn } from "@/lib/utils";
import { getVibeInfo } from "@/lib/utils/groupColors";
import { getGroupTheme } from "@/lib/utils/groupTheme";
import type { Group } from "@/src/shared/types";

/** The first few groups as small cards, each linking to the group. */
export function RecentJourneys({ groups }: { groups: Group[] }) {
  return (
    <div className='flex min-w-0 flex-[999_1_420px] flex-col gap-3'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-bold'>Recent journeys</h2>
        <Link href='/groups' className='text-[13px] font-semibold text-[#fbbf24]'>
          View all
        </Link>
      </div>

      {groups.length === 0 ? (
        <p className='rounded-2xl border border-dashed border-white/[.12] p-5 text-sm text-[#94a3b8]'>
          No journeys yet. Create or join a group to start one.
        </p>
      ) : (
        <div className='grid grid-cols-[repeat(auto-fill,minmax(min(220px,100%),1fr))] gap-[10px]'>
          {groups.slice(0, 6).map((group) => {
            const theme = getGroupTheme(group.colorScheme);
            const tripCount = group.trips?.length ?? 0;
            return (
              <Link
                key={group.id}
                href={`/group/${group.id}`}
                className='flex items-center gap-3 rounded-2xl border border-white/[.08] bg-[rgba(15,23,42,.6)] p-3 text-inherit transition-[border-color] hover:border-white/[.18]'
              >
                <span className={cn("flex size-10 flex-none items-center justify-center rounded-xl border text-xl", theme.tile)}>
                  {group.emoji || getVibeInfo(group.colorScheme).emoji}
                </span>
                <span className='flex min-w-0 flex-col gap-[2px]'>
                  <span className='truncate text-sm font-bold'>{group.name}</span>
                  <span className='text-xs text-[#64748b]'>
                    {tripCount} {tripCount === 1 ? "trip" : "trips"}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
