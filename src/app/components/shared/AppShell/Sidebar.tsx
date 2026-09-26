"use client";

import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGroups } from "@/src/hooks/useGroups";
import { cn } from "@/lib/utils";
import { getGroupTheme } from "@/lib/utils/groupTheme";
import { UserAvatar } from "../UserAvatar";
import { NotificationsMenu } from "./NotificationsMenu";
import { NAV_ITEMS, activeGroupId, activeNavKey } from "./nav";
import { useShellUser } from "./useShellUser";

/** Desktop navigation: logo, the five pages, your groups, and you. Hidden below md (the tab bar takes over). */
export function Sidebar() {
  const pathname = usePathname() ?? "";
  const activeKey = activeNavKey(pathname);
  const openGroupId = activeGroupId(pathname);
  const { data: groupsData } = useGroups();
  const user = useShellUser();

  const groups = [...(groupsData?.groups ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <aside className='sticky top-0 z-[20] hidden h-screen w-[236px] flex-none flex-col gap-[26px] border-r border-white/[.06] bg-[rgba(2,6,23,.72)] px-[14px] py-5 md:flex'>
      <div className='flex items-center justify-between gap-2 px-2'>
        <Link href='/dashboard' className='flex items-center gap-[10px] text-inherit'>
          <Image src='/wanderly.png' alt='' width={28} height={28} className='size-7 object-contain' />
          <span className='text-lg font-extrabold tracking-[-.02em]'>Wanderly</span>
        </Link>
        <NotificationsMenu align='left' />
      </div>

      <div className='flex min-h-0 flex-1 flex-col gap-[26px] overflow-y-auto [scrollbar-width:none]'>
        <nav className='flex flex-col gap-[2px]'>
          {NAV_ITEMS.map(({ key, label, href, icon: Icon }) => (
            <Link
              key={key}
              href={href}
              aria-current={activeKey === key ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-[10px] text-sm font-semibold",
                activeKey === key ? "bg-white/[.06] text-[#f8fafc]" : "text-[#94a3b8] hover:text-[#f8fafc]",
              )}
            >
              <Icon className='size-[18px]' />
              <span className='flex-1'>{label}</span>
            </Link>
          ))}
        </nav>

        <div className='flex flex-col gap-[6px]'>
          <span className='px-3 font-mono text-[10px] uppercase tracking-[.16em] text-[#475569]'>Your groups</span>
          {groups.map((group) => {
            const open = openGroupId === group.id;
            return (
              <Link
                key={group.id}
                href={`/group/${group.id}`}
                className={cn(
                  "flex items-center gap-[10px] rounded-[10px] px-3 py-[7px] text-[13px] font-medium",
                  open ? "bg-white/[.06] text-[#f8fafc]" : "text-[#94a3b8] hover:text-[#f8fafc]",
                )}
              >
                <span className={cn("size-2 flex-none rounded-full", getGroupTheme(group.colorScheme).dot)} />
                <span className='truncate'>{group.name}</span>
              </Link>
            );
          })}
          <Link
            href='/group/create'
            className='flex items-center gap-[10px] rounded-[10px] px-3 py-[7px] text-[13px] font-semibold text-[#fbbf24]'
          >
            <Plus className='size-[14px]' strokeWidth={2.4} />
            New group
          </Link>
        </div>
      </div>

      <Link
        href='/profile'
        className='flex items-center gap-[10px] rounded-[14px] border border-white/[.06] bg-[rgba(15,23,42,.6)] p-[10px] text-inherit'
      >
        <UserAvatar name={user.name} colorKey={user.email} imageUrl={user.imageUrl} className='size-[34px] text-xs' />
        <span className='flex min-w-0 flex-col gap-[2px]'>
          <span className='truncate text-[13px] font-bold'>{user.name}</span>
          <span className='truncate text-[11px] text-[#64748b]'>{user.email}</span>
        </span>
      </Link>
    </aside>
  );
}
