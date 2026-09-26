import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface DetailHeaderProps {
  href: string;
  /** Where you are, e.g. "Paraluman · Members". */
  crumb: string;
}

/** Round back button and a mono breadcrumb, at the top of every page inside a group. */
export function DetailHeader({ href, crumb }: DetailHeaderProps) {
  return (
    <div className='mb-5 flex items-center gap-3'>
      <Link
        href={href}
        aria-label='Back'
        className='flex size-[38px] flex-none items-center justify-center rounded-full border border-white/[.1] bg-white/[.03] text-[#e2e8f0]'
      >
        <ArrowLeft className='size-[18px]' />
      </Link>
      <span className='truncate font-mono text-[11px] uppercase tracking-[.14em] text-[#64748b]'>{crumb}</span>
    </div>
  );
}
