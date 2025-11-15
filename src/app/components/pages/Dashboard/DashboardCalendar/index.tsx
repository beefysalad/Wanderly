"use client";
import { Button } from "@/components/ui/button";
import { getDaysInMonth, getFirstDayOfMonth } from "@/lib/helper";
import { Group, Trip } from "@/src/shared/types";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import React, { useState } from "react";

interface IDashboardCalendarProps {
  groups: Group[];
  setShowCalendar: (show: boolean) => void;
  showCalendar: boolean;
  getTripsForDate: (date: Date) => (Trip & {
    groupColor: string;
    groupName: string;
  })[];
}

const DashboardCalendar = ({
  groups,
  setShowCalendar,
  showCalendar,
  getTripsForDate,
}: IDashboardCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const previousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };
  return (
    <div className='w-full lg:w-80 flex-shrink-0 mb-6 lg:mb-0'>
      <div className='bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6 lg:sticky lg:top-8'>
        <div className='flex items-center justify-between mb-3'>
          <h3 className='text-sm font-bold text-slate-900 flex items-center gap-2'>
            <CalendarIcon className='w-4 h-4 text-amber-500' />
            Trip Calendar
          </h3>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setShowCalendar(!showCalendar)}
            className='h-7 px-2 text-xs hover:bg-amber-50'
          >
            {showCalendar ? "Hide" : "Show"}
          </Button>
        </div>

        {showCalendar && (
          <>
            <div className='flex items-center justify-between mb-3'>
              <Button
                variant='ghost'
                size='icon'
                onClick={previousMonth}
                className='hover:bg-amber-50 hover:text-amber-600 h-8 w-8'
              >
                <ChevronLeft className='w-4 h-4' />
              </Button>
              <h4 className='text-sm font-semibold text-slate-900'>
                {monthNames[currentMonth]} {currentYear}
              </h4>
              <Button
                variant='ghost'
                size='icon'
                onClick={nextMonth}
                className='hover:bg-amber-50 hover:text-amber-600 h-8 w-8'
              >
                <ChevronRight className='w-4 h-4' />
              </Button>
            </div>

            <div className='grid grid-cols-7 gap-1'>
              {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
                <div
                  key={idx}
                  className='text-center text-xs font-semibold text-slate-600 py-1'
                >
                  {day}
                </div>
              ))}

              {Array.from({ length: firstDay }).map((_, index) => (
                <div key={`empty-${index}`} className='aspect-square' />
              ))}

              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1;
                const date = new Date(currentYear, currentMonth, day);
                const tripsOnDate = getTripsForDate(date);
                const isToday =
                  day === new Date().getDate() &&
                  currentMonth === new Date().getMonth() &&
                  currentYear === new Date().getFullYear();

                return (
                  <div
                    key={day}
                    className={`aspect-square border rounded flex flex-col items-center justify-center relative text-xs ${
                      isToday
                        ? "border-amber-500 bg-amber-50"
                        : "border-slate-200"
                    } ${
                      tripsOnDate.length > 0
                        ? "cursor-pointer hover:bg-slate-50"
                        : ""
                    }`}
                    title={tripsOnDate
                      .map((t) => `${t.name} (${t.groupName})`)
                      .join(", ")}
                  >
                    <span
                      className={`font-medium ${
                        isToday ? "text-amber-600" : "text-slate-700"
                      }`}
                    >
                      {day}
                    </span>
                    {tripsOnDate.length > 0 && (
                      <div className='flex gap-0.5 mt-0.5'>
                        {tripsOnDate.slice(0, 2).map((trip, idx) => (
                          <div
                            key={idx}
                            className={`w-1.5 h-1.5 rounded-full ${trip.groupColor}`}
                          />
                        ))}
                        {tripsOnDate.length > 2 && (
                          <span className='text-[8px] text-slate-500'>
                            +{tripsOnDate.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className='mt-3 pt-3 border-t border-slate-200'>
              <p className='text-xs font-semibold text-slate-600 mb-2'>
                Legend:
              </p>
              <div className='space-y-1'>
                {groups.slice(0, 5).map((group, index) => {
                  const colors = [
                    "bg-amber-500",
                    "bg-orange-500",
                    "bg-rose-500",
                    "bg-pink-500",
                    "bg-purple-500",
                  ];
                  return (
                    <div key={group.id} className='flex items-center gap-2'>
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          colors[index % colors.length]
                        }`}
                      />
                      <span className='text-xs text-slate-600 truncate'>
                        {group.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardCalendar;
