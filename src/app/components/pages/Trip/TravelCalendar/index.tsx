import { Button } from "@/components/ui/button";
import { Activity } from "@/src/shared/types";
import { Plus, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import React, { useState } from "react";
import { formatTime12Hour } from "@/lib/utils";

interface ITravelCalendarProps {
  startDate: Date;
  endDate: Date;
  activities: Activity[];
  onAddActivity?: (activity: Omit<Activity, "id">) => void;
  onUpdateActivity?: (id: string, updates: Partial<Activity>) => void;
  onDeleteActivity?: (id: string) => void;
  onToggleDone?: (id: string) => void;
  onOpenAddModal?: (date: Date) => void;
  onEditActivity?: (activity: Activity) => void;
  onViewActivity?: (activity: Activity) => void;
  readOnly?: boolean;
}

const TravelCalendar = ({
  activities,
  endDate,
  onOpenAddModal,
  startDate,
  onViewActivity,
  readOnly = false,
}: ITravelCalendarProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const daysPerPage = 9; // 3x3 grid on desktop, fewer on mobile

  const getDaysInRange = () => {
    const days = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const allDays = getDaysInRange();
  const totalPages = Math.ceil(allDays.length / daysPerPage);
  const startIndex = (currentPage - 1) * daysPerPage;
  const endIndex = startIndex + daysPerPage;
  const days = allDays.slice(startIndex, endIndex);

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const getTransportationIcon = (mode?: string) => {
    const icons: Record<string, string> = {
      car: "🚗",
      bus: "🚌",
      plane: "✈️",
      train: "🚊",
      taxi: "🚕",
      walking: "🚶",
      commute: "🚌",
    };
    return icons[mode || ""] || "🚗";
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <h2 className='text-3xl sm:text-4xl font-bold text-white'>
          Calendar Overview
        </h2>
        {totalPages > 1 && (
          <span className='text-sm font-medium text-slate-400'>
            Page {currentPage} of {totalPages}
          </span>
        )}
      </div>

      {/* Calendar Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6'>
        {days.map((date, index) => {
          const dayActivities = activities
            .filter((a) => {
              const actDate = new Date(a.date);
              return (
                actDate.getFullYear() === date.getFullYear() &&
                actDate.getMonth() === date.getMonth() &&
                actDate.getDate() === date.getDate()
              );
            })
            .sort((a, b) => {
              if (!a.startTime && !b.startTime) return 0;
              if (!a.startTime) return 1;
              if (!b.startTime) return -1;
              return a.startTime.localeCompare(b.startTime);
            });

          const isToday = date.toDateString() === new Date().toDateString();

          return (
            <div
              key={index}
              className={`bg-slate-800/40 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border transition-all duration-300 ${
                isToday
                  ? "border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.1)]"
                  : "border-white/5 hover:border-white/10 hover:bg-slate-800/60"
              }`}
            >
              {/* Date Header */}
              <div className='flex items-center justify-between mb-4 pb-3 border-b border-white/5'>
                <div>
                  <p className='text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5'>
                    {date.toLocaleDateString("en-US", { weekday: "short" })}
                  </p>
                  <div className='flex items-baseline gap-2'>
                    <p
                      className={`text-2xl sm:text-3xl font-bold leading-none ${isToday ? "text-white" : "text-slate-200"}`}
                    >
                      {date.toLocaleDateString("en-US", { day: "numeric" })}
                    </p>
                    <p className='text-sm font-medium text-slate-400'>
                      {date.toLocaleDateString("en-US", { month: "short" })}
                    </p>
                    {isToday && (
                      <span className='px-2 py-0.5 text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-full ml-1'>
                        TODAY
                      </span>
                    )}
                  </div>
                </div>
                <div className='text-right'>
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                      dayActivities.length > 0
                        ? "bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20"
                        : "bg-slate-700/50 text-slate-500"
                    }`}
                  >
                    {dayActivities.length}
                  </span>
                </div>
              </div>

              {/* Activities - Compact List */}
              {dayActivities.length > 0 ? (
                <div className='space-y-1 mb-4'>
                  {dayActivities.slice(0, 5).map((activity) => (
                    <div
                      key={activity.id}
                      className={`py-2 px-2.5 rounded-xl transition-all ${
                        activity.done
                          ? "opacity-50"
                          : onViewActivity
                            ? "hover:bg-white/5 cursor-pointer border border-transparent hover:border-white/5"
                            : ""
                      }`}
                      onClick={() => onViewActivity?.(activity)}
                    >
                      <div className='flex items-center gap-2.5'>
                        {/* Transportation Icon - Small */}
                        {activity.transportationMode && (
                          <span className='text-sm flex-shrink-0 bg-slate-900/50 p-1 rounded-md'>
                            {getTransportationIcon(activity.transportationMode)}
                          </span>
                        )}

                        {/* Title and Time - Inline */}
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center justify-between gap-2'>
                            <p
                              className={`text-sm font-medium truncate ${
                                activity.done
                                  ? "line-through text-slate-500"
                                  : "text-slate-200"
                              }`}
                            >
                              {activity.title}
                            </p>
                            {(activity.startTime || activity.pickupTime) && (
                              <span className='text-[10px] font-bold text-orange-400/80 flex items-center gap-1 flex-shrink-0 bg-orange-500/5 px-1.5 py-0.5 rounded'>
                                {activity.startTime
                                  ? formatTime12Hour(
                                      activity.startTime,
                                    ).replace(/\s[AP]M/, "")
                                  : activity.pickupTime
                                    ? formatTime12Hour(
                                        activity.pickupTime,
                                      ).replace(/\s[AP]M/, "")
                                    : ""}
                              </span>
                            )}
                          </div>
                          {/* Location - Inline if exists */}
                          {(activity.pickupLocation ||
                            activity.dropoffLocation) && (
                            <div className='flex items-center gap-1 mt-0.5'>
                              <MapPin className='w-2.5 h-2.5 text-slate-600 flex-shrink-0' />
                              <span className='text-[10px] text-slate-500 truncate block'>
                                {activity.pickupLocation ||
                                  activity.dropoffLocation}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {dayActivities.length > 5 && (
                    <div className='pt-2 text-center'>
                      <span className='text-xs font-medium text-slate-500'>
                        +{dayActivities.length - 5} more
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className='py-10 text-center flex flex-col items-center justify-center opacity-50'>
                  <div className='w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center mb-2'>
                    <span className='text-lg grayscale'>🥥</span>
                  </div>
                  <p className='text-xs font-medium text-slate-500'>
                    No events
                  </p>
                </div>
              )}

              {/* Add Button */}
              {!readOnly && onOpenAddModal && (
                <Button
                  onClick={() => onOpenAddModal(date)}
                  variant='outline'
                  size='sm'
                  className='w-full text-xs font-bold uppercase tracking-wider text-orange-400 border border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10 hover:border-orange-500/30 hover:text-orange-300 py-2 h-9 rounded-xl transition-all'
                >
                  <Plus className='w-3.5 h-3.5 mr-1.5' />
                  Add Activity
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='flex items-center justify-center gap-3 pt-6'>
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className='px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5 hover:border-white/10 transition-all duration-200 flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md'
          >
            <ChevronLeft className='w-4 h-4' />
            Previous
          </button>
          <span className='px-5 py-2.5 text-sm font-medium text-slate-400 bg-slate-800 border border-white/5 rounded-xl'>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className='px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5 hover:border-white/10 transition-all duration-200 flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md'
          >
            Next
            <ChevronRight className='w-4 h-4' />
          </button>
        </div>
      )}
    </div>
  );
};

export default TravelCalendar;
