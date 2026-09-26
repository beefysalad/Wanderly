import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GridBackdrop } from "../Site/GridBackdrop";
import { DetailHeader } from "./DetailHeader";
import { MobileTabBar } from "./MobileTabBar";
import { MobileTopBar } from "./MobileTopBar";
import { ShellEffects } from "./ShellEffects";
import { Sidebar } from "./Sidebar";

interface AppShellProps {
  children: ReactNode;
  /**
   * "top" pages (home, trips, groups, alerts, profile) get the phone top bar and bottom tabs.
   * "detail" pages hide both and show a back button instead.
   */
  level?: "top" | "detail";
  /** Back target and breadcrumb, for detail pages. */
  back?: { href: string; crumb: string };
}

/**
 * The signed-in chrome: sidebar on desktop, top bar and tab bar on phones, on the same dark canvas as the
 * public site. Pages opt in by wrapping themselves. Geist is set here because <html> never receives the
 * font variable.
 */
export function AppShell({ children, level = "top", back }: AppShellProps) {
  const isTop = level === "top";

  return (
    <div className='relative flex min-h-screen bg-[#020617] font-[family-name:var(--font-geist-sans)] leading-[normal] text-[#f8fafc]'>
      <ShellEffects />
      <Sidebar />
      <div className='@container relative min-w-0 flex-1'>
        <GridBackdrop position='absolute' className='bottom-auto h-[640px]' />
        {isTop ? <MobileTopBar /> : null}
        <div
          className={cn(
            "relative z-[1] mx-auto box-border max-w-[1120px] px-[clamp(18px,4cqw,40px)] pt-[clamp(20px,3.4cqw,36px)]",
            isTop ? "pb-[110px] md:pb-12" : "pb-10 md:pb-12",
          )}
        >
          {back ? <DetailHeader href={back.href} crumb={back.crumb} /> : null}
          {children}
        </div>
      </div>
      {isTop ? <MobileTabBar /> : null}
    </div>
  );
}
