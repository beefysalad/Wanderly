import { cn } from "@/lib/utils";

interface Stat {
  label: string;
  value: number;
}

/** Three numbers in one rounded strip. */
export function StatsStrip({ stats }: { stats: Stat[] }) {
  return (
    <div className='grid grid-cols-3 rounded-[18px] border border-white/[.08] bg-[rgba(15,23,42,.6)]'>
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className={cn("flex flex-col gap-1 px-[18px] py-[14px]", index > 0 && "border-l border-white/[.06]")}
        >
          <span className='font-mono text-[10px] uppercase tracking-[.16em] text-[#64748b]'>{stat.label}</span>
          <span className='text-[26px] font-extrabold tracking-[-.02em] tabular-nums'>{stat.value}</span>
        </div>
      ))}
    </div>
  );
}
