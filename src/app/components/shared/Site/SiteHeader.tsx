import Image from "next/image";
import Link from "next/link";

// Below md only Login and Start free fit next to the logo; the text links live in the footer too.
const NAV_LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/features", label: "Features" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/reviews", label: "Reviews" },
];

interface SiteHeaderProps {
  /** href of the page being shown, highlighted in the nav. */
  active?: string;
  /** The home page spaces its nav a little wider than the inner pages. */
  roomy?: boolean;
}

export function SiteHeader({ active, roomy = false }: SiteHeaderProps) {
  return (
    <header className='sticky top-0 z-50 flex items-center justify-between gap-6 border-b border-white/[.06] bg-[rgba(2,6,23,.72)] px-[clamp(16px,4vw,48px)] py-[14px] backdrop-blur-[18px]'>
      <Link href='/' className='flex items-center gap-[10px] text-inherit'>
        <Image src='/wanderly.png' alt='Wanderly' width={32} height={32} className='size-8 object-contain' />
        <span className='text-[19px] font-extrabold tracking-[-.02em] text-[#f8fafc]'>Wanderly</span>
      </Link>

      <nav
        className={`flex flex-wrap items-center justify-end text-sm ${
          roomy ? "gap-[clamp(12px,2vw,28px)]" : "gap-[clamp(10px,1.8vw,24px)]"
        }`}
      >
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`hidden md:inline ${active === link.href ? "font-semibold text-[#f8fafc]" : "text-[#94a3b8]"}`}
          >
            {link.label}
          </Link>
        ))}
        <Link href='/login' className='font-medium text-[#e2e8f0]'>
          Login
        </Link>
        <Link
          href='/register'
          className='rounded-full bg-[#fbbf24] px-[18px] py-[9px] text-sm font-bold text-[#0b0a06] shadow-[0_6px_24px_-8px_rgba(251,191,36,.7)]'
        >
          Start free
        </Link>
      </nav>
    </header>
  );
}
