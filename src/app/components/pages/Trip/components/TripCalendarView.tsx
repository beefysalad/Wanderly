"use client";

import { cn } from "@/lib/utils";
import type { Activity } from "@/src/shared/types";
import { monthGrids } from "../tripView";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

interface TripCalendarViewProps {
  startDate: Date;
  endDate: Date;
  activities: Activity[];
  /** Called with the trip day (0-based) that was tapped, to jump to it in the Day tab. */
  onPickDay: (tripDay: number) => void;
}

/** A month grid per month of the trip: trip days are highlighted and show how many plans they hold. */
export function TripCalendarView({ startDate, endDate, activities, onPickDay }: TripCalendarViewProps) {
  return (
    <div className='flex flex-col gap-4'>
      {monthGrids(startDate, endDate, activities).map((grid) => (
        <div
          key={grid.label}
          className='flex flex-col gap-[14px] rounded-[22px] border border-white/[.08] bg-[rgba(15,23,42,.6)] p-[clamp(14px,2.4cqw,22px)]'
        >
          <span className='text-base font-bold'>{grid.label}</span>
          <div className='grid grid-cols-7 gap-[6px]'>
            {WEEKDAYS.map((weekday) => (
              <span key={weekday} className='px-1 font-mono text-[10px] text-[#475569]'>
                {weekday}
              </span>
            ))}
            {grid.cells.map((cell, index) => {
              const inTrip = cell.tripDay !== null;
              return (
                <button
                  key={index}
                  type='button'
                  disabled={!inTrip}
                  onClick={() => cell.tripDay !== null && onPickDay(cell.tripDay)}
                  className={cn(
                    "box-border flex min-h-[clamp(44px,9cqw,84px)] flex-col items-start justify-between rounded-xl border p-[6px] text-left",
                    cell.day === null && "border-transparent bg-transparent",
                    cell.day !== null && !inTrip && "border-white/[.04] bg-[rgba(2,6,23,.4)]",
                    inTrip && "cursor-pointer border-[rgba(251,191,36,.3)] bg-[rgba(251,191,36,.08)] hover:bg-[rgba(251,191,36,.14)]",
                  )}
                >
                  <span className={cn("text-[13px]", inTrip ? "font-bold text-[#f8fafc]" : "font-medium text-[#64748b]")}>
                    {cell.day}
                  </span>
                  {inTrip ? (
                    <span className='font-mono text-[10px] text-[#fbbf24]'>
                      {cell.count ? `${cell.count} ${cell.count === 1 ? "plan" : "plans"}` : "Free"}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
