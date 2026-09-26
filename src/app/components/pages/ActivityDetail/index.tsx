"use client";

import { ArrowRight, Calendar, FileText, Navigation2, Wallet } from "lucide-react";
import { cn, formatTime12Hour } from "@/lib/utils";
import { formatPeso } from "@/lib/utils/money";
import type { Activity, Expense } from "@/src/shared/types";
import { ItemMenu } from "../../shared/ItemMenu";
import { TickButton } from "../Trip/components/ActivityParts";

interface IActivityDetailProps {
  activity: Activity;
  expenses?: Expense[];
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleDone?: () => void;
  onSelectExpense?: (expense: Expense) => void;
  readOnly?: boolean;
}

const CARD = "rounded-[22px] border border-white/[.08] bg-[rgba(15,23,42,.6)] p-[18px]";
const CARD_LABEL = "font-mono text-[10px] uppercase tracking-[.16em] text-[#64748b]";

const MODE_EMOJI: Record<string, string> = {
  car: "🚗",
  bus: "🚌",
  plane: "✈️",
  train: "🚊",
  taxi: "🚕",
  walking: "🚶",
  commute: "🚌",
};

const timeRange = (activity: Activity) => {
  if (activity.startTime && activity.endTime) {
    return `${formatTime12Hour(activity.startTime)} – ${formatTime12Hour(activity.endTime)}`;
  }
  if (activity.startTime) return `Starts at ${formatTime12Hour(activity.startTime)}`;
  if (activity.endTime) return `Ends at ${formatTime12Hour(activity.endTime)}`;
  return null;
};

/** One activity: when, notes, how to get there, and the expenses linked to it. Chrome comes from the container. */
const ActivityDetail = ({
  activity,
  expenses = [],
  onEdit,
  onDelete,
  onToggleDone,
  onSelectExpense,
  readOnly = false,
}: IActivityDetailProps) => {
  const linkedExpenses = expenses.filter((expense) => expense.activityId === activity.id);
  const when = timeRange(activity);
  const hasJourney =
    activity.transportationMode || activity.pickupTime || activity.pickupLocation || activity.dropoffLocation;

  return (
    <div className='mx-auto flex max-w-[760px] flex-col gap-5'>
      <div className='flex items-start gap-4'>
        <TickButton
          done={activity.done}
          onToggle={readOnly ? undefined : onToggleDone}
          label={activity.title}
        />
        <div className='min-w-0 flex-1'>
          <p className='mb-2 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[.16em] text-[#64748b]'>
            <Calendar className='size-3' />
            {new Date(activity.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            <span className={activity.done ? "text-[#34d399]" : "text-[#fbbf24]"}>
              · {activity.done ? "Completed" : "Planned"}
            </span>
          </p>
          <h1
            className={cn(
              "text-[clamp(28px,4.4cqw,40px)] font-extrabold leading-[1.05] tracking-[-.03em] [overflow-wrap:anywhere]",
              activity.done && "text-[#64748b] line-through decoration-[#334155]",
            )}
          >
            {activity.title}
          </h1>
          {when ? <p className='mt-2 font-mono text-[15px] text-[#fbbf24]'>{when}</p> : null}
        </div>
        {readOnly ? null : <ItemMenu noun='activity' onEdit={onEdit} onDelete={onDelete} />}
      </div>

      <div className={CARD}>
        <p className={cn(CARD_LABEL, "mb-3 flex items-center gap-2")}>
          <FileText className='size-[13px]' />
          Notes
        </p>
        {activity.notes ? (
          <p className='whitespace-pre-wrap text-[15px] leading-[1.6] text-[#cbd5e1]'>{activity.notes}</p>
        ) : (
          <p className='text-sm text-[#64748b]'>No notes added yet.</p>
        )}
      </div>

      {hasJourney ? (
        <div className={CARD}>
          <p className={cn(CARD_LABEL, "mb-4 flex items-center gap-2")}>
            <Navigation2 className='size-[13px]' />
            Journey
          </p>
          <div className='flex flex-col gap-4'>
            {activity.transportationMode ? (
              <div className='flex items-center gap-3'>
                <span className='flex size-11 items-center justify-center rounded-xl border border-white/[.08] bg-[rgba(2,6,23,.6)] text-xl'>
                  {MODE_EMOJI[activity.transportationMode] ?? "🧭"}
                </span>
                <span className='text-base font-bold capitalize'>{activity.transportationMode}</span>
              </div>
            ) : null}

            {activity.pickupLocation || activity.pickupTime ? (
              <div className='flex gap-3'>
                <span className='mt-[6px] size-2 flex-none rounded-full bg-[#38bdf8]' />
                <div>
                  <p className={CARD_LABEL}>{activity.transportationMode === "plane" ? "Departure" : "Pickup"}</p>
                  <p className='mt-1 text-[15px] font-semibold'>{activity.pickupLocation || "No location set"}</p>
                  {activity.pickupTime ? (
                    <p className='mt-1 font-mono text-[13px] text-[#38bdf8]'>{formatTime12Hour(activity.pickupTime)}</p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {activity.dropoffLocation ? (
              <div className='flex gap-3'>
                <span className='mt-[6px] size-2 flex-none rounded-full bg-[#fb923c]' />
                <div>
                  <p className={CARD_LABEL}>{activity.transportationMode === "plane" ? "Arrival" : "Dropoff"}</p>
                  <p className='mt-1 text-[15px] font-semibold'>{activity.dropoffLocation}</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className={CARD}>
        <p className={cn(CARD_LABEL, "mb-3 flex items-center gap-2")}>
          <Wallet className='size-[13px]' />
          Linked expenses{linkedExpenses.length > 0 ? ` · ${linkedExpenses.length}` : ""}
        </p>
        {linkedExpenses.length === 0 ? (
          <p className='text-sm text-[#64748b]'>No expenses linked to this activity.</p>
        ) : (
          <div className='flex flex-col gap-2'>
            {linkedExpenses.map((expense) => (
              <button
                key={expense.id}
                type='button'
                onClick={() => onSelectExpense?.(expense)}
                className='flex w-full cursor-pointer items-center gap-3 rounded-xl border border-white/[.08] bg-[rgba(2,6,23,.4)] p-3 text-left hover:border-white/[.18]'
              >
                <span className='min-w-0 flex-1'>
                  <span className='block truncate text-sm font-bold'>{expense.description}</span>
                  <span className='block truncate text-xs text-[#64748b]'>Paid by {expense.paidBy.split("@")[0]}</span>
                </span>
                <span className='font-mono text-sm font-semibold text-[#fbbf24]'>{formatPeso(expense.amount)}</span>
                <ArrowRight className='size-4 flex-none text-[#64748b]' />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityDetail;
