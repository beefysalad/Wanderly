import Link from "next/link";
import { cn } from "@/lib/utils";
import { getVibeInfo } from "@/lib/utils/groupColors";
import { getGroupTheme } from "@/lib/utils/groupTheme";
import type { Group } from "@/src/shared/types";
import { AvatarStack } from "../../shared/UserAvatar";
import { nextTripLine } from "../../shared/tripDates";
import { groupPeople } from "../Dashboard/groupPeople";

/** A group as a card: emoji tile and member avatars, vibe, name, size, and what's coming next. */
export function GroupCard({ group, today }: { group: Group; today: Date }) {
  const vibe = getVibeInfo(group.colorScheme);
  const theme = getGroupTheme(group.colorScheme);
  const members = group.memberEmails?.length ?? 0;
  const trips = group.trips ?? [];

  return (
    <Link
      href={`/group/${group.id}`}
      className='flex flex-col gap-[18px] rounded-[22px] border border-white/[.08] bg-[rgba(15,23,42,.6)] p-[18px] text-inherit transition-[border-color,background-color] hover:border-white/[.18] hover:bg-[rgba(15,23,42,.9)]'
    >
      <span className='flex items-center justify-between'>
        <span className={cn("flex size-12 items-center justify-center rounded-[15px] border text-2xl", theme.tile)}>
          {group.emoji || vibe.emoji}
        </span>
        <AvatarStack people={groupPeople(group)} sizeClass='size-[26px] text-[9px]' />
      </span>
      <span className='flex flex-col gap-1'>
        <span className={cn("font-mono text-[10px] uppercase tracking-[.14em]", theme.text)}>{vibe.name}</span>
        <span className='text-xl font-extrabold tracking-[-.02em]'>{group.name}</span>
        <span className='text-[13px] text-[#94a3b8]'>
          {members} {members === 1 ? "member" : "members"} · {trips.length} {trips.length === 1 ? "trip" : "trips"}
        </span>
      </span>
      <span className='border-t border-white/[.06] pt-3 text-[13px] text-[#cbd5e1]'>{nextTripLine(trips, today)}</span>
    </Link>
  );
}
