import Link from "next/link";

const FOOTER_LINKS = {
  home: { href: "/", label: "Home" },
  howItWorks: { href: "/how-it-works", label: "How it works" },
  features: { href: "/features", label: "Features" },
  howTo: { href: "/how-to", label: "How to" },
  about: { href: "/about", label: "About" },
  faq: { href: "/faq", label: "FAQ" },
  reviews: { href: "/reviews", label: "Reviews" },
  guest: { href: "/guest/join", label: "Guest" },
} as const;

export type FooterLinkKey = keyof typeof FOOTER_LINKS;

export const COPYRIGHT = {
  rights: "© 2026 Wanderly. All rights reserved.",
  location: "© 2026 Wanderly · Manila, Philippines",
} as const;

interface SiteFooterProps {
  copyright: string;
  /** Each page leaves out the link to itself, so the list differs from page to page. */
  links: FooterLinkKey[];
}

/** The compact footer used by the inner pages (the home page has its own, larger one). */
export function SiteFooter({ copyright, links }: SiteFooterProps) {
  return (
    <footer className='relative z-[1] flex flex-wrap items-center justify-between gap-4 border-t border-white/[.06] px-[clamp(20px,4vw,48px)] py-[clamp(36px,5vw,56px)]'>
      <p className='text-xs text-[#475569]'>{copyright}</p>
      <nav className='flex flex-wrap gap-5 text-[13px]'>
        {links.map((key) => (
          <Link key={key} href={FOOTER_LINKS[key].href} className='text-[#94a3b8]'>
            {FOOTER_LINKS[key].label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
