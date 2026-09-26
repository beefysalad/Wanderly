"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Activity } from "@/src/shared/types";
import { PILL } from "../../../shared/Pills";
import { activitiesOn, activitySubline, activityTime, dayMeta, tripDays } from "../tripView";
import { TickButton, TimeChip } from "./ActivityParts";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface DayViewProps {
  startDate: Date;
  endDate: Date;
  activities: Activity[];
  /** Day to open on (from a calendar tap); defaults to the first day. */
  initialDay?: number;
  onViewActivity?: (activity: Activity) => void;
  /** Omit for a read-only viewer: ticks become plain circles. */
  onToggleDone?: (id: string) => void;
  /** Where "Add activity" leads for the selected day; omit to hide it. */
  addHref?: (date: Date) => string;
}

/** One day at a time: a strip of day chips, that day's heading, and its activities. */
export function DayView({ startDate, endDate, activities, initialDay = 0, onViewActivity, onToggleDone, addHref }: DayViewProps) {
  const days = tripDays(startDate, endDate);
  const [selected, setSelected] = useState(Math.min(initialDay, Math.max(days.length - 1, 0)));
  const strip = useRef<HTMLDivElement>(null);

  useEffect(() => setSelected(Math.min(initialDay, Math.max(days.length - 1, 0))), [initialDay, days.length]);

  // Keep the selected chip in view on narrow screens.
  useEffect(() => {
    strip.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [selected]);

  const date = days[selected] ?? startDate;
  const dayActivities = activitiesOn(activities, date);
  const done = dayActivities.filter((activity) => activity.done).length;

  return (
    <div className='flex flex-col gap-5'>
      <div ref={strip} className='flex gap-2 overflow-x-auto px-[2px] pb-[6px] pt-1 [scrollbar-width:none]'>
        {days.map((day, index) => {
          const on = index === selected;
          const busy = activitiesOn(activities, day).length > 0;
          return (
            <button
              key={index}
              type='button'
              aria-current={on}
              onClick={() => setSelected(index)}
              className={cn(
                "flex h-[76px] w-[62px] flex-none cursor-pointer flex-col items-center justify-center gap-[3px] rounded-2xl border",
                on ? "border-transparent bg-[linear-gradient(100deg,#fbbf24,#f97316)]" : "border-white/[.06] bg-[rgba(15,23,42,.6)]",
              )}
            >
              <span className={cn("font-mono text-[10px] uppercase tracking-[.1em]", on ? "text-[#422006]" : "text-[#64748b]")}>
                {WEEKDAYS[day.getDay()]}
              </span>
              <span className={cn("text-[22px] font-extrabold", on ? "text-[#160c02]" : "text-[#e2e8f0]")}>{day.getDate()}</span>
              <span className={cn("size-1 rounded-full", busy && !on ? "bg-[#fb923c]" : "bg-transparent")} />
            </button>
          );
        })}
      </div>

      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h2 className='mb-1 text-[22px] font-extrabold tracking-[-.02em]'>
            {WEEKDAYS_LONG[date.getDay()]}, {MONTHS_LONG[date.getMonth()]} {date.getDate()}
          </h2>
          <p className='font-mono text-[11px] uppercase tracking-[.12em] text-[#64748b]'>
            {dayMeta(selected, days.length, dayActivities.length)}
          </p>
        </div>
        <div className='flex items-center gap-3'>
          {dayActivities.length > 0 ? (
            <span className='text-[13px] text-[#94a3b8]'>
              {done} of {dayActivities.length} done
            </span>
          ) : null}
          {addHref ? (
            <Link href={addHref(date)} className={PILL.amber}>
              <Plus className='size-[14px]' strokeWidth={2.4} />
              Add activity
            </Link>
          ) : null}
        </div>
      </div>

      <div className='flex flex-col gap-[10px]'>
        {dayActivities.map((activity) => {
          const time = activityTime(activity);
          const sub = activitySubline(activity);
          return (
            <div
              key={activity.id}
              className={cn(
                "flex items-center gap-3 rounded-2xl border bg-[rgba(30,41,59,.4)] p-[14px]",
                activity.done ? "border-[rgba(52,211,153,.22)]" : "border-white/[.05]",
              )}
            >
              <TickButton
                done={!!activity.done}
                label={activity.title}
                onToggle={onToggleDone ? () => onToggleDone(activity.id) : undefined}
              />
              {time ? <TimeChip time={time} /> : null}
              <button
                type='button'
                onClick={() => onViewActivity?.(activity)}
                className={cn("flex min-w-0 flex-col gap-[2px] text-left", onViewActivity && "cursor-pointer")}
              >
                <span
                  className={cn(
                    "truncate text-[15px] font-semibold",
                    activity.done ? "text-[#64748b] line-through" : "text-[#e2e8f0]",
                  )}
                >
                  {activity.title}
                </span>
                {sub ? <span className='truncate text-xs text-[#64748b]'>{sub}</span> : null}
              </button>
            </div>
          );
        })}
        {dayActivities.length === 0 ? (
          <div className='rounded-[18px] border border-dashed border-white/[.14] p-7 text-center text-sm text-[#94a3b8]'>
            Nothing planned for this day yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}
