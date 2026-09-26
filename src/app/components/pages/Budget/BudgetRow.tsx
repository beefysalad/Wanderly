"use client";

import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatPeso } from "@/lib/utils/money";
import { useUpdateBudget } from "@/src/hooks/useBudgets";
import type { Budget } from "@/src/shared/types";
import { budgetMeta } from "./budgetView";

interface BudgetRowProps {
  budget: Budget;
  groupId: string;
  tripId: string;
  onEdit: (budget: Budget) => void;
  onDelete: (budgetId: string) => void;
}

/** A planned item with its amount, edit and delete, and a Booked switch. */
export function BudgetRow({ budget, groupId, tripId, onEdit, onDelete }: BudgetRowProps) {
  const update = useUpdateBudget(tripId, budget.id, groupId);

  const toggleBooked = () =>
    update.mutate({ isBooked: !budget.isBooked }, { onError: () => toast.error("Couldn't update that item") });

  return (
    <div className='flex items-center gap-[14px] border-t border-white/[.05] px-[18px] py-[13px] first:border-t-0'>
      <span className='flex min-w-0 flex-1 flex-col gap-[2px]'>
        <span className='truncate text-sm font-semibold text-[#e2e8f0]'>{budget.description || "Untitled item"}</span>
        {budgetMeta(budget) ? <span className='truncate text-xs text-[#64748b]'>{budgetMeta(budget)}</span> : null}
      </span>
      <span className='text-sm font-bold tabular-nums'>{formatPeso(Number(budget.amount))}</span>
      <span className='flex flex-none items-center gap-1'>
        <button
          type='button'
          aria-label='Edit item'
          onClick={() => onEdit(budget)}
          className='flex size-8 cursor-pointer items-center justify-center rounded-lg text-[#64748b] hover:bg-white/[.06] hover:text-[#f8fafc]'
        >
          <Pencil className='size-[15px]' />
        </button>
        <button
          type='button'
          aria-label='Delete item'
          onClick={() => onDelete(budget.id)}
          className='flex size-8 cursor-pointer items-center justify-center rounded-lg text-[#64748b] hover:bg-[rgba(248,113,113,.1)] hover:text-[#f87171]'
        >
          <Trash2 className='size-[15px]' />
        </button>
      </span>
      <button
        type='button'
        role='switch'
        aria-checked={budget.isBooked}
        aria-label={`Booked: ${budget.description || "item"}`}
        disabled={update.isPending}
        onClick={toggleBooked}
        className={cn(
          "flex h-6 w-10 flex-none cursor-pointer items-center rounded-full p-[3px] disabled:cursor-wait",
          budget.isBooked ? "justify-end bg-[#34d399]" : "justify-start bg-white/[.1]",
        )}
      >
        <span className={cn("size-[18px] rounded-full", budget.isBooked ? "bg-[#052e1f]" : "bg-[#64748b]")} />
      </button>
    </div>
  );
}
