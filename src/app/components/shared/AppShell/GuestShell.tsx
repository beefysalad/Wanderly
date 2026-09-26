import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { getGroupTheme } from "@/lib/utils/groupTheme";
import type { Group } from "@/src/shared/types";
import { GridBackdrop } from "../Site/GridBackdrop";
import { PILL, PillLink } from "../Pills";
import { DetailHeader } from "./DetailHeader";
import { cn } from "@/lib/utils";

type GuestGroup = Pick<Group, "id" | "name" | "emoji" | "colorScheme">;

interface GuestShellProps {
  children: ReactNode;
  /** The group being peeked at. Missing while it loads or when it isn't found. */
  group?: GuestGroup | null;
  /** Back target and breadcrumb; omit on the group's own page. */
  back?: { href: string; crumb: string };
}

const Logo = ({ size }: { size: number }) => (
  <Link href='/' className='flex items-center gap-[10px] text-inherit'>
    <Image src='/wanderly.png' alt='' width={size} height={size} className='object-contain' />
    <span className='text-lg font-extrabold tracking-[-.02em]'>Wanderly</span>
  </Link>
);

/**
 * The read-only chrome for someone peeking in with a group code: a sidebar that lists only that group, and an
 * amber banner saying so. There is no account, so no tab bar, notifications or profile.
 */
export function GuestShell({ children, group, back }: GuestShellProps) {
  const theme = getGroupTheme(group?.colorScheme);

  return (
    <div className='relative flex min-h-screen bg-[#020617] font-[family-name:var(--font-geist-sans)] leading-[normal] text-[#f8fafc]'>
      <aside className='sticky top-0 z-[20] hidden h-screen w-[236px] flex-none flex-col gap-[26px] border-r border-white/[.06] bg-[rgba(2,6,23,.72)] px-[14px] py-5 md:flex'>
        <div className='px-2'>
          <Logo size={28} />
        </div>

        <div className='flex flex-1 flex-col gap-[6px]'>
          <span className='px-3 font-mono text-[10px] uppercase tracking-[.16em] text-[#475569]'>Guest access</span>
          {group ? (
            <Link
              href={`/guest/group/${group.id}`}
              className='flex items-center gap-[10px] rounded-[10px] bg-white/[.06] px-3 py-[7px] text-[13px] font-medium'
            >
              <span className={cn("size-2 flex-none rounded-full", theme.dot)} />
              <span className='truncate'>{group.name}</span>
            </Link>
          ) : null}
        </div>

        <PillLink href='/register' className='justify-center'>
          Start free
        </PillLink>
      </aside>

      <div className='@container relative min-w-0 flex-1'>
        <GridBackdrop position='absolute' className='bottom-auto h-[640px]' />

        <div className='sticky top-0 z-[5] flex items-center justify-between border-b border-white/[.06] bg-[rgba(2,6,23,.72)] px-[18px] py-[14px] backdrop-blur-[18px] md:hidden'>
          <Logo size={26} />
        </div>

        <div className='relative z-[1] mx-auto box-border max-w-[1120px] px-[clamp(18px,4cqw,40px)] pb-12 pt-[clamp(20px,3.4cqw,36px)]'>
          <div className='mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[rgba(245,158,11,.28)] bg-[rgba(245,158,11,.08)] px-4 py-3'>
            <p className='text-[13px] text-[#fde68a]'>
              <span className='font-bold'>Guest view{group ? ` of ${group.name}` : ""}</span> · read-only
            </p>
            <Link href='/register' className={cn(PILL.amber)}>
              Start free
            </Link>
          </div>

          {back ? <DetailHeader href={back.href} crumb={back.crumb} /> : null}
          {children}
        </div>
      </div>
    </div>
  );
}
