import { Plus } from "lucide-react";
import Link from "next/link";
import { dateEyebrow } from "./dashboardData";

/** Mono date, "Welcome back, {name}." and the two ways to get into a group. */
export function DashboardHeader({ firstName, today }: { firstName: string; today: Date }) {
  return (
    <div className='flex flex-wrap items-end justify-between gap-5'>
      <div>
        <p className='mb-[10px] font-mono text-[11px] uppercase tracking-[.18em] text-[#64748b]'>{dateEyebrow(today)}</p>
        <h1 className='text-[clamp(32px,4.6cqw,50px)] font-extrabold leading-none tracking-[-.035em]'>
          Welcome back, <span className='text-[#fbbf24]'>{firstName}.</span>
        </h1>
      </div>
      <div className='flex flex-wrap gap-[10px]'>
        <Link
          href='/group/create'
          className='inline-flex items-center gap-2 rounded-full bg-[linear-gradient(100deg,#fbbf24,#f97316)] px-[18px] py-[11px] text-sm font-extrabold text-[#160c02] shadow-[0_18px_40px_-18px_rgba(251,146,60,.9)]'
        >
          <Plus className='size-[14px]' strokeWidth={2.4} />
          Create group
        </Link>
        <Link
          href='/group/join'
          className='inline-flex items-center gap-2 rounded-full border border-white/[.14] bg-white/[.03] px-[18px] py-[11px] text-sm font-semibold text-[#e2e8f0]'
        >
          Join with code
        </Link>
      </div>
    </div>
  );
}
