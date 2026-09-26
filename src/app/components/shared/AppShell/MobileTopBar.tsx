"use client";

import { Bell } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useUnreadCount } from "@/src/hooks/useNotifications";
import { UserAvatar } from "../UserAvatar";
import { useShellUser } from "./useShellUser";

/** Sticky bar for the top-level pages on phones: logo, notifications, you. */
export function MobileTopBar() {
  const { data: unread } = useUnreadCount();
  const user = useShellUser();

  return (
    <div className='sticky top-0 z-[5] flex items-center justify-between border-b border-white/[.06] bg-[rgba(2,6,23,.72)] px-[18px] py-[14px] backdrop-blur-[18px] md:hidden'>
      <Link href='/dashboard' className='flex items-center gap-[9px] text-inherit'>
        <Image src='/wanderly.png' alt='' width={26} height={26} className='size-[26px] object-contain' />
        <span className='text-[17px] font-extrabold tracking-[-.02em]'>Wanderly</span>
      </Link>
      <div className='flex items-center gap-[10px]'>
        <Link
          href='/notifications'
          aria-label='Notifications'
          className='relative flex size-[38px] items-center justify-center rounded-full border border-white/[.1] bg-white/[.03] text-[#e2e8f0]'
        >
          <Bell className='size-[17px]' />
          {(unread?.count ?? 0) > 0 ? (
            <span className='absolute right-2 top-[7px] size-2 rounded-full border-2 border-[#020617] bg-[#fbbf24]' />
          ) : null}
        </Link>
        <Link href='/profile' aria-label='Profile'>
          <UserAvatar name={user.name} colorKey={user.email} imageUrl={user.imageUrl} className='size-9 text-xs' />
        </Link>
      </div>
    </div>
  );
}
