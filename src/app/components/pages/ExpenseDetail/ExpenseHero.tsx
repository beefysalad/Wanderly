import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { formatPeso } from "@/lib/utils/money";
import type { Activity, Expense } from "@/src/shared/types";
import { meterWidth } from "../../shared/meterWidth";
import { UserAvatar } from "../../shared/UserAvatar";
import { CATEGORY_STYLE, categoryKey } from "../Expenses/expenseView";

const CHIP = "flex items-center rounded-full border border-white/[.08] bg-[rgba(30,41,59,.4)] px-3 py-[5px] text-[13px] text-[#cbd5e1]";

interface ExpenseHeroProps {
  expense: Expense;
  payer: { name: string; key: string; imageUrl?: string; isYou: boolean };
  linkedActivity?: Activity;
  onOpenActivity?: (activity: Activity) => void;
  ways: number;
  paidBack: { done: number; total: number; percent: number };
  menu?: ReactNode;
}

/** Category and date, the title, the big amount, who paid, the split and how much has come back. */
export function ExpenseHero({ expense, payer, linkedActivity, onOpenActivity, ways, paidBack, menu }: ExpenseHeroProps) {
  const category = CATEGORY_STYLE[categoryKey(expense.category)];
  const date = new Date(expense.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className='flex flex-col gap-[18px] rounded-[26px] border border-white/[.09] bg-[linear-gradient(180deg,rgba(15,23,42,.92),rgba(2,6,23,.92))] p-[clamp(18px,3cqw,26px)]'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <p className={cn("mb-2 font-mono text-[10px] uppercase tracking-[.16em]", category.text)}>
            {category.label} · {date}
          </p>
          <h1 className='mb-[6px] text-[clamp(26px,4cqw,36px)] font-extrabold leading-[1.05] tracking-[-.03em] [overflow-wrap:anywhere]'>
            {expense.description}
          </h1>
          <p className='text-[clamp(34px,5.4cqw,52px)] font-extrabold tracking-[-.03em] tabular-nums text-[#fbbf24]'>
            {formatPeso(expense.amount)}
          </p>
        </div>
        {menu}
      </div>

      <div className='flex flex-wrap gap-[10px]'>
        <span className={cn(CHIP, "gap-2 py-[5px] pl-[5px] pr-3")}>
          <UserAvatar name={payer.name} colorKey={payer.key} imageUrl={payer.imageUrl} className='size-6 text-[9px]' />
          Paid by {payer.isYou ? "you" : payer.name}
        </span>
        {linkedActivity ? (
          onOpenActivity ? (
            <button type='button' onClick={() => onOpenActivity(linkedActivity)} className={cn(CHIP, "cursor-pointer hover:border-white/[.2]")}>
              {linkedActivity.title}
            </button>
          ) : (
            <span className={CHIP}>{linkedActivity.title}</span>
          )
        ) : null}
        <span className={CHIP}>Split {ways} ways</span>
      </div>

      <div className='flex flex-col gap-2'>
        <span className='flex justify-between text-[13px]'>
          <span className='text-[#94a3b8]'>Paid back</span>
          <span className='font-semibold text-[#e2e8f0]'>
            {paidBack.done} of {paidBack.total}
          </span>
        </span>
        <span className='block h-[6px] overflow-hidden rounded-md bg-white/[.06]'>
          <span className={cn("block h-full rounded-md bg-[#34d399]", meterWidth(paidBack.percent))} />
        </span>
      </div>
    </div>
  );
}
