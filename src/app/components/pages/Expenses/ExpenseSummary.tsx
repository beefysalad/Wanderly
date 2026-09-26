import { formatPeso } from "@/lib/utils/money";

const TILE = "flex flex-col gap-1 rounded-[18px] border p-4";
const LABEL = "font-mono text-[10px] uppercase tracking-[.16em]";
const AMOUNT = "text-[28px] font-extrabold tabular-nums";

/** What you owe, what you're owed, and what the trip has cost so far. */
export function ExpenseSummary({ youOwe, youAreOwed, total }: { youOwe: number; youAreOwed: number; total: number }) {
  return (
    <div className='grid grid-cols-[repeat(auto-fit,minmax(min(180px,100%),1fr))] gap-[10px]'>
      <div className={`${TILE} border-[rgba(251,146,60,.25)] bg-[rgba(251,146,60,.07)]`}>
        <span className={`${LABEL} text-[#fdba74]`}>You owe</span>
        <span className={`${AMOUNT} text-[#fb923c]`}>{formatPeso(youOwe)}</span>
      </div>
      <div className={`${TILE} border-[rgba(52,211,153,.25)] bg-[rgba(52,211,153,.07)]`}>
        <span className={`${LABEL} text-[#6ee7b7]`}>You&apos;re owed</span>
        <span className={`${AMOUNT} text-[#34d399]`}>{formatPeso(youAreOwed)}</span>
      </div>
      <div className={`${TILE} border-white/[.08] bg-[rgba(15,23,42,.6)]`}>
        <span className={`${LABEL} text-[#64748b]`}>Trip total</span>
        <span className={`${AMOUNT} text-[#fbbf24]`}>{formatPeso(total)}</span>
      </div>
    </div>
  );
}
