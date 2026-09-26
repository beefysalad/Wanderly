import { cn } from "@/lib/utils";
import type { Budget, Expense } from "@/src/shared/types";
import { formatPeso } from "@/lib/utils/money";
import { meterWidth } from "../../shared/meterWidth";
import { budgetMeters } from "./budgetView";

const BAR_COLOR = ["bg-[#fb923c]", "bg-[#34d399]", "bg-[#38bdf8]"];

/** Three meters: planned, booked and spent. */
export function BudgetMeters({ budgets, expenses }: { budgets: Budget[]; expenses: Expense[] }) {
  return (
    <div className='grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-[10px]'>
      {budgetMeters(budgets, expenses).map((meter, index) => (
        <div key={meter.label} className='flex flex-col gap-2 rounded-[18px] border border-white/[.08] bg-[rgba(15,23,42,.6)] p-4'>
          <span className='font-mono text-[10px] uppercase tracking-[.16em] text-[#64748b]'>{meter.label}</span>
          <span className='text-[26px] font-extrabold tabular-nums'>{formatPeso(meter.amount)}</span>
          <span className='block h-[6px] overflow-hidden rounded-md bg-white/[.06]'>
            <span
              className={cn("block h-full rounded-md", meter.over ? "bg-[#f87171]" : BAR_COLOR[index], meterWidth(meter.percent))}
            />
          </span>
          <span className={cn("text-xs", meter.over ? "text-[#f87171]" : "text-[#64748b]")}>{meter.note}</span>
        </div>
      ))}
    </div>
  );
}
