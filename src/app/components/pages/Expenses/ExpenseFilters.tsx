import { Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PILL } from "../../shared/Pills";
import type { ExpensesView } from "./expenseStats";

interface ExpenseFiltersProps {
  view: ExpensesView;
  onChange: (view: ExpensesView) => void;
  counts: { all: number; unsettled: number; settled: number };
  /** Omit for a read-only viewer. */
  addHref?: string;
}

/** All / Unsettled / Settled / Analysis / History pills, and the Add expense pill. */
export function ExpenseFilters({ view, onChange, counts, addHref }: ExpenseFiltersProps) {
  const filters: { id: ExpensesView; label: string; count?: number }[] = [
    { id: "all", label: "All", count: counts.all },
    { id: "unsettled", label: "Unsettled", count: counts.unsettled },
    { id: "settled", label: "Settled", count: counts.settled },
    { id: "analysis", label: "Analysis" },
    { id: "logs", label: "History" },
  ];

  return (
    <div className='flex flex-wrap items-center justify-between gap-3'>
      <div className='flex max-w-full gap-[6px] overflow-x-auto [scrollbar-width:none]'>
        {filters.map((filter) => (
          <button
            key={filter.id}
            type='button'
            aria-pressed={view === filter.id}
            onClick={() => onChange(filter.id)}
            className={cn(
              "flex flex-none cursor-pointer items-center gap-[7px] rounded-full border px-[13px] py-[7px] text-[13px] font-semibold",
              view === filter.id
                ? "border-[rgba(251,191,36,.45)] bg-[rgba(251,191,36,.1)] text-[#fbbf24]"
                : "border-white/[.1] bg-transparent text-[#cbd5e1]",
            )}
          >
            {filter.label}
            {filter.count !== undefined ? <span className='font-mono text-[11px] text-[#64748b]'>{filter.count}</span> : null}
          </button>
        ))}
      </div>
      {addHref ? (
        <Link href={addHref} className={cn(PILL.amber, "px-[15px] py-[9px]")}>
          <Plus className='size-[14px]' strokeWidth={2.4} />
          Add expense
        </Link>
      ) : null}
    </div>
  );
}
