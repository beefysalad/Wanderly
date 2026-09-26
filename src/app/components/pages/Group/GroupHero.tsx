import { ChevronRight, Copy, UserPlus } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { getVibeInfo } from "@/lib/utils/groupColors";
import { getGroupTheme } from "@/lib/utils/groupTheme";
import type { Group } from "@/src/shared/types";
import { AvatarStack } from "../../shared/UserAvatar";
import { PILL } from "../../shared/Pills";
import { groupPeople } from "../Dashboard/groupPeople";

const TILE = "flex flex-col gap-[10px] rounded-2xl border border-white/[.05] bg-[rgba(30,41,59,.4)] p-[14px] text-left";
const TILE_LABEL = "flex items-center justify-between font-mono text-[10px] uppercase tracking-[.16em] text-[#64748b]";

interface GroupHeroProps {
  group: Group;
  upcomingCount: number;
  /** Where the Members tile leads. */
  membersHref: string;
  onCopyCode: () => void;
  /** Invite and the menu are for members; a read-only viewer sees neither. */
  onInvite?: () => void;
  menu?: ReactNode;
}

/** The group's emoji, vibe and name, and three tiles: members, group code, trips. */
export function GroupHero({ group, upcomingCount, membersHref, onCopyCode, onInvite, menu }: GroupHeroProps) {
  const vibe = getVibeInfo(group.colorScheme);
  const theme = getGroupTheme(group.colorScheme);
  const members = group.memberEmails?.length ?? 0;
  const trips = group.trips?.length ?? 0;

  return (
    <div className='flex flex-col gap-5 rounded-[26px] border border-white/[.09] bg-[linear-gradient(180deg,rgba(15,23,42,.92),rgba(2,6,23,.92))] p-[clamp(18px,3cqw,26px)]'>
      <div className='flex flex-wrap items-center gap-[18px]'>
        <span className={cn("flex size-16 flex-none items-center justify-center rounded-[20px] border text-[32px]", theme.tile)}>
          {group.emoji || vibe.emoji}
        </span>
        <div className='min-w-0 flex-[1_1_200px]'>
          <p className={cn("mb-[6px] font-mono text-[10px] uppercase tracking-[.16em]", theme.text)}>{vibe.name} vibe</p>
          <h1 className='text-[clamp(28px,4cqw,40px)] font-extrabold leading-[1.05] tracking-[-.03em] [overflow-wrap:anywhere]'>
            {group.name}
          </h1>
        </div>
        <div className='flex items-center gap-2'>
          {onInvite ? (
            <button type='button' onClick={onInvite} className={cn(PILL.ghost, "px-4 py-[10px]")}>
              <UserPlus className='size-4' />
              Invite
            </button>
          ) : null}
          {menu}
        </div>
      </div>

      <div className='grid grid-cols-[repeat(auto-fit,minmax(min(190px,100%),1fr))] gap-[10px]'>
        <Link href={membersHref} className={cn(TILE, "text-inherit hover:border-white/[.14]")}>
          <span className={TILE_LABEL}>
            Members
            <ChevronRight className='size-[14px]' />
          </span>
          <span className='flex items-center gap-[10px]'>
            <AvatarStack people={groupPeople(group)} sizeClass='size-7 text-[10px]' />
            <span className='text-sm font-semibold'>
              {members} {members === 1 ? "person" : "people"}
            </span>
          </span>
        </Link>
        <button type='button' onClick={onCopyCode} className={cn(TILE, "cursor-pointer hover:border-[rgba(251,191,36,.35)]")}>
          <span className={TILE_LABEL}>
            Group code
            <Copy className='size-[14px]' />
          </span>
          <span className='font-mono text-[22px] font-semibold tracking-[.14em] text-[#fbbf24]'>{group.code}</span>
        </button>
        <div className={TILE}>
          <span className={TILE_LABEL}>Trips</span>
          <span className='text-sm font-semibold'>
            <span className='text-[22px] font-extrabold'>{trips}</span> · {upcomingCount} upcoming
          </span>
        </div>
      </div>
    </div>
  );
}
