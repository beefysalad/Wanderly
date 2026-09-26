"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, activeNavKey } from "./nav";

/** Full-width bottom tabs for the top-level pages on phones (replaces the old floating pill). */
export function MobileTabBar() {
  const activeKey = activeNavKey(usePathname() ?? "");

  return (
    <nav className='fixed inset-x-0 bottom-0 z-[6] grid grid-cols-4 border-t border-white/[.06] bg-[rgba(2,6,23,.9)] px-2 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 backdrop-blur-[18px] md:hidden'>
      {NAV_ITEMS.map(({ key, tabLabel, href, icon: Icon }) => (
        <Link
          key={key}
          href={href}
          aria-current={activeKey === key ? "page" : undefined}
          className={cn(
            "flex flex-col items-center gap-1 py-[6px] text-[10px] font-semibold",
            activeKey === key ? "text-[#fbbf24]" : "text-[#64748b]",
          )}
        >
          <Icon className='size-[22px]' />
          {tabLabel}
        </Link>
      ))}
    </nav>
  );
}
