import type { ReactNode } from "react";
import { GridBackdrop } from "./GridBackdrop";
import { COPYRIGHT, SiteFooter, type FooterLinkKey } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

interface SiteShellProps {
  children: ReactNode;
  /** href of the page being shown, highlighted in the nav. */
  active?: string;
  roomyNav?: boolean;
  /** Replaces the compact footer. */
  footer?: ReactNode;
  /** Copyright line and links for the compact footer. */
  footerCopyright?: string;
  footerLinks?: FooterLinkKey[];
}

/**
 * Page chrome for the public pages: dark canvas, faint grid that fades out towards the bottom of the
 * viewport, sticky header and a footer. Geist is set here because the app's <html> never receives the
 * font variable, so the base font would otherwise fall back to the system font.
 */
export function SiteShell({ children, active, roomyNav, footer, footerCopyright, footerLinks }: SiteShellProps) {
  return (
    <main className='relative min-h-screen overflow-x-hidden bg-[#020617] font-[family-name:var(--font-geist-sans)] leading-[normal] text-[#f8fafc]'>
      <GridBackdrop />
      <SiteHeader active={active} roomy={roomyNav} />
      {children}
      {footer ?? <SiteFooter copyright={footerCopyright ?? COPYRIGHT.rights} links={footerLinks ?? []} />}
    </main>
  );
}
