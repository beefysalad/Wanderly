import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { getVibeInfo } from "@/lib/utils/groupColors";
import { getGroupTheme } from "@/lib/utils/groupTheme";
import { cn } from "@/lib/utils";
import type { Group } from "@/src/shared/types";

function HomeGroupCard({ group }: { group: Group }) {
  const vibe = getVibeInfo(group.colorScheme);
  const theme = getGroupTheme(group.colorScheme);
  const members = group.memberEmails?.length ?? 0;
  const trips = group.trips?.length ?? 0;

  return (
    <Link
      href={`/group/${group.id}`}
      className='flex min-h-[168px] flex-col gap-4 rounded-[20px] border border-white/[.08] bg-[rgba(15,23,42,.6)] p-4 text-inherit transition-[border-color,background-color] hover:border-white/[.18] hover:bg-[rgba(15,23,42,.9)]'
    >
      <span className={cn("flex size-11 items-center justify-center rounded-[14px] border text-[22px]", theme.tile)}>
        {group.emoji || vibe.emoji}
      </span>
      <span className='flex flex-col gap-1'>
        <span className={cn("font-mono text-[10px] uppercase tracking-[.14em]", theme.text)}>{vibe.name}</span>
        <span className='text-lg font-bold tracking-[-.01em]'>{group.name}</span>
      </span>
      <span className='mt-auto text-xs text-[#94a3b8]'>
        {members} {members === 1 ? "member" : "members"} · {trips} {trips === 1 ? "trip" : "trips"}
      </span>
    </Link>
  );
}

/** The three newest groups, with a link to all of them. */
export function YourGroups({ groups, total }: { groups: Group[]; total: number }) {
  return (
    <div className='flex flex-col gap-[14px]'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-bold'>Your groups</h2>
        <Link href='/groups' className='flex items-center gap-1 text-[13px] font-semibold text-[#fbbf24]'>
          Show all ({total})
          <ChevronRight className='size-[14px]' />
        </Link>
      </div>
      <div className='grid grid-cols-[repeat(auto-fill,minmax(min(170px,100%),1fr))] gap-3'>
        {groups.map((group) => (
          <HomeGroupCard key={group.id} group={group} />
        ))}
      </div>
    </div>
  );
}
