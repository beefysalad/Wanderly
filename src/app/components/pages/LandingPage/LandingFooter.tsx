import Image from "next/image";
import Link from "next/link";

const EXPLORE_LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/features", label: "Features" },
  { href: "/how-to", label: "How to" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/reviews", label: "Reviews" },
];

const START_LINKS = [
  { href: "/register", label: "Sign up" },
  { href: "/login", label: "Login" },
  { href: "/guest/join", label: "Join as guest" },
];

const COLUMN_TITLE = "font-mono text-[10px] uppercase tracking-[.2em] text-[#94a3b8]";
const COLUMN_LINK = "text-sm text-[#94a3b8]";

export function LandingFooter() {
  return (
    <footer className='relative z-[1] border-t border-white/[.06] px-[clamp(20px,4vw,48px)] py-[clamp(40px,5vw,64px)]'>
      <div className='mx-auto grid max-w-[1240px] grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-9'>
        <div className='min-w-0'>
          <div className='mb-[14px] flex items-center gap-[10px]'>
            <Image src='/wanderly.png' alt='Wanderly' width={34} height={34} className='size-[34px] object-contain' />
            <div>
              <p className='text-lg font-extrabold text-[#f8fafc]'>Wanderly</p>
              <p className='text-[11px] text-[#64748b]'>Plan trips, not chaos</p>
            </div>
          </div>
          <p className='max-w-[30em] text-sm leading-[1.65] text-[#64748b]'>
            Group trip planning without the seventeen open tabs.
          </p>
        </div>

        <div className='flex flex-col gap-3'>
          <p className={COLUMN_TITLE}>Explore</p>
          {EXPLORE_LINKS.map((link) => (
            <Link key={link.label} href={link.href} className={COLUMN_LINK}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className='flex flex-col gap-3'>
          <p className={COLUMN_TITLE}>Get started</p>
          {START_LINKS.map((link) => (
            <Link key={link.label} href={link.href} className={COLUMN_LINK}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className='flex flex-col gap-3'>
          <p className={COLUMN_TITLE}>Status</p>
          <p className='text-[13px] text-[#64748b]'>Version 1.0.0</p>
          <p className='text-[13px] text-[#64748b]'>Made by one person, carefully.</p>
        </div>
      </div>

      <div className='mx-auto mt-9 flex max-w-[1240px] flex-wrap justify-between gap-3 border-t border-white/[.06] pt-6'>
        <p className='text-xs text-[#475569]'>© 2026 Wanderly. All rights reserved.</p>
        <p className='text-xs text-[#475569]'>Manila · Philippines</p>
      </div>
    </footer>
  );
}
