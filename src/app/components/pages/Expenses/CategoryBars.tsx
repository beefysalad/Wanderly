import { cn } from "@/lib/utils";
import { formatPeso } from "@/lib/utils/money";
import type { Expense } from "@/src/shared/types";
import { meterWidth } from "../../shared/meterWidth";
import { CATEGORY_STYLE, spendingByCategory } from "./expenseView";

/** "Spending by category": one bar per category. */
export function CategoryBars({ expenses }: { expenses: Expense[] }) {
  const rows = spendingByCategory(expenses);

  return (
    <div className='flex flex-col gap-[14px] rounded-[22px] border border-white/[.08] bg-[rgba(15,23,42,.6)] p-[18px]'>
      <span className='font-mono text-[10px] uppercase tracking-[.16em] text-[#64748b]'>Spending by category</span>
      {rows.map((row) => (
        <div key={row.key} className='flex flex-col gap-[6px]'>
          <span className='flex justify-between text-[13px]'>
            <span className='font-semibold text-[#e2e8f0]'>{row.label}</span>
            <span className='tabular-nums text-[#94a3b8]'>
              {formatPeso(row.amount)} · {row.percent}%
            </span>
          </span>
          <span className='block h-2 overflow-hidden rounded-lg bg-white/[.06]'>
            <span className={cn("block h-full rounded-lg", CATEGORY_STYLE[row.key].bar, meterWidth(row.relative))} />
          </span>
        </div>
      ))}
      {rows.length === 0 ? <span className='text-[13px] text-[#64748b]'>Nothing to break down yet.</span> : null}
    </div>
  );
}
