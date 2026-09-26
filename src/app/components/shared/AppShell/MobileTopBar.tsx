"use client";

import Image from "next/image";
import Link from "next/link";
import { UserAvatar } from "../UserAvatar";
import { NotificationsMenu } from "./NotificationsMenu";
import { useShellUser } from "./useShellUser";

/** Sticky bar for the top-level pages on phones: logo, notifications, you. */
export function MobileTopBar() {
  const user = useShellUser();

  return (
    <div className='sticky top-0 z-[5] flex items-center justify-between border-b border-white/[.06] bg-[rgba(2,6,23,.72)] px-[18px] py-[14px] backdrop-blur-[18px] md:hidden'>
      <Link href='/dashboard' className='flex items-center gap-[9px] text-inherit'>
        <Image src='/wanderly.png' alt='' width={26} height={26} className='size-[26px] object-contain' />
        <span className='text-[17px] font-extrabold tracking-[-.02em]'>Wanderly</span>
      </Link>
      <div className='flex items-center gap-[10px]'>
        <NotificationsMenu align='right' buttonClassName='size-[38px]' />
        <Link href='/profile' aria-label='Profile'>
          <UserAvatar name={user.name} colorKey={user.email} imageUrl={user.imageUrl} className='size-9 text-xs' />
        </Link>
      </div>
    </div>
  );
}
