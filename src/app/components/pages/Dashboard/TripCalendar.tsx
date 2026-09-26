"use client";

import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { getGroupTheme } from "@/lib/utils/groupTheme";
import { buildMonthCells, dateTile, monthLabel, tripWhen, type TripWithGroup } from "../../shared/tripDates";

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
const ARROW = "flex size-7 cursor-pointer items-center justify-center rounded-lg text-[#94a3b8] hover:bg-white/[.06] hover:text-[#f8fafc]";

interface TripCalendarProps {
  trips: TripWithGroup[];
  upcoming: TripWithGroup[];
  today: Date;
}

/** A month grid where trip days take their group's colour, and the next few trips below it. */
export function TripCalendar({ trips, upcoming, today }: TripCalendarProps) {
  const [{ year, month }, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const cells = buildMonthCells(year, month, trips, today);

  const shift = (delta: number) =>
    setView((view) => {
      const next = new Date(view.year, view.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });

  return (
    <div className='flex min-w-0 flex-col gap-4 rounded-[22px] border border-white/[.08] bg-[rgba(15,23,42,.6)] p-[18px]'>
      <div className='flex items-center justify-between gap-2'>
        <span className='flex items-center gap-2 text-sm font-bold'>
          <Calendar className='size-[18px]' />
          Trip calendar
        </span>
        <div className='flex items-center gap-1'>
          <button type='button' aria-label='Previous month' onClick={() => shift(-1)} className={ARROW}>
            <ChevronLeft className='size-4' />
          </button>
          <span className='min-w-[108px] text-center text-[13px] font-semibold'>{monthLabel(year, month)}</span>
          <button type='button' aria-label='Next month' onClick={() => shift(1)} className={ARROW}>
            <ChevronRight className='size-4' />
          </button>
        </div>
      </div>

      <div className='grid grid-cols-7 gap-1'>
        {WEEKDAY_LETTERS.map((letter, index) => (
          <span key={index} className='py-[2px] text-center font-mono text-[10px] text-[#475569]'>
            {letter}
          </span>
        ))}
        {cells.map((cell, index) => {
          const tinted = cell.schemes.length > 0;
          return (
            <div
              key={index}
              className={cn(
                "box-border flex aspect-square flex-col items-center justify-center gap-[3px] rounded-[9px] border border-transparent text-xs tabular-nums",
                tinted ? getGroupTheme(cell.schemes[0]).cell : "",
                cell.isToday && "border-[#fbbf24]",
                tinted || cell.isToday ? "font-bold text-[#f8fafc]" : "font-medium text-[#94a3b8]",
              )}
            >
              {cell.day}
              <span className='flex h-[3px] gap-[2px]'>
                {cell.schemes.map((scheme, bar) => (
                  <span key={bar} className={cn("h-[3px] w-[9px] rounded-sm", getGroupTheme(scheme).bar)} />
                ))}
              </span>
            </div>
          );
        })}
      </div>

      <div className='flex flex-col gap-2 border-t border-white/[.06] pt-[14px]'>
        <span className='font-mono text-[10px] uppercase tracking-[.16em] text-[#64748b]'>Coming up</span>
        {upcoming.length === 0 ? <p className='text-[13px] text-[#64748b]'>Nothing planned yet.</p> : null}
        {upcoming.slice(0, 3).map((trip) => {
          const tile = dateTile(trip);
          return (
            <Link
              key={trip.id}
              href={`/group/${trip.groupId}/trip/${trip.id}`}
              className='-mx-[6px] flex items-center gap-3 rounded-xl p-[6px] text-inherit hover:bg-white/[.04]'
            >
              <span className='flex h-11 w-[42px] flex-none flex-col items-center justify-center rounded-[10px] border border-white/[.06] bg-[rgba(2,6,23,.6)]'>
                <span className={cn("font-mono text-[9px] tracking-[.1em]", getGroupTheme(trip.group.colorScheme).text)}>
                  {tile.month}
                </span>
                <span className='text-base font-extrabold leading-[1.1]'>{tile.day}</span>
              </span>
              <span className='flex min-w-0 flex-1 flex-col gap-[2px]'>
                <span className='truncate text-sm font-semibold'>{trip.name}</span>
                <span className='truncate text-xs text-[#64748b]'>
                  {trip.group.name} · {tripWhen(trip, today)}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
