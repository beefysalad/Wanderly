import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatPeso } from "@/lib/utils/money";
import type { Expense, Group } from "@/src/shared/types";
import { UserAvatar } from "../../shared/UserAvatar";
import { CATEGORY_STYLE, TONE_CLASS, categoryKey, expenseStatusLine, payerIdentity } from "./expenseView";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

/** One expense: who paid, what for, the amount, and what it means for you. */
export function ExpenseRow({ expense, group, userEmail, href }: { expense: Expense; group: Group; userEmail: string; href: string }) {
  const payer = payerIdentity(group, expense.paidBy, userEmail);
  const status = expenseStatusLine(expense, userEmail);
  const category = CATEGORY_STYLE[categoryKey(expense.category)];

  return (
    <Link
      href={href}
      className='flex items-center gap-[14px] rounded-2xl border border-white/[.06] bg-[rgba(15,23,42,.6)] p-[14px] text-inherit transition-[border-color] hover:border-white/[.16]'
    >
      <UserAvatar name={payer.name} colorKey={payer.key} imageUrl={payer.imageUrl} className='size-9 text-[11px]' />
      <span className='flex min-w-0 flex-1 flex-col gap-[3px]'>
        <span className='truncate text-[15px] font-semibold'>{expense.description}</span>
        <span className='truncate text-xs text-[#64748b]'>
          {payer.short} paid · {formatDate(expense.date)} · {category.label}
        </span>
      </span>
      <span className='flex flex-none flex-col items-end gap-[3px]'>
        <span className='text-[15px] font-bold tabular-nums'>{formatPeso(expense.amount)}</span>
        <span className={cn("text-xs font-semibold", TONE_CLASS[status.tone])}>{status.text}</span>
      </span>
    </Link>
  );
}
