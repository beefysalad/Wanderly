import { Button } from "@/components/ui/button";
import { Activity } from "@/src/shared/types";
import {
  Trash2,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import React, { useState } from "react";
import { formatTime12Hour } from "@/lib/utils";

interface ITravelScheduleProps {
  startDate: Date;
  endDate: Date;
  activities: Activity[];
  onAddActivity?: (activity: Omit<Activity, "id">) => void;
  onUpdateActivity?: (id: string, updates: Partial<Activity>) => void;
  onDeleteActivity?: (id: string) => void;
  onToggleDone?: (id: string) => void;
  onEditActivity?: (activity: Activity) => void;
  onViewActivity?: (activity: Activity) => void;
  tripName?: string;
  readOnly?: boolean;
}

const TravelSchedule = ({
  activities,
  endDate,
  onDeleteActivity,
  onToggleDone,
  onEditActivity,
  onViewActivity,
  startDate,
  readOnly = false,
}: ITravelScheduleProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());
  const daysPerPage = 7; // Show 7 days per page
  const ACTIVITIES_THRESHOLD = 5; // Show first 5 activities, then collapse

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

  const toggleDayExpansion = (dateKey: string) => {
    setExpandedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dateKey)) {
        newSet.delete(dateKey);
      } else {
        newSet.add(dateKey);
      }
      return newSet;
    });
  };

  const toggleDayCollapse = (dateKey: string) => {
    setCollapsedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dateKey)) {
        newSet.delete(dateKey);
      } else {
        newSet.add(dateKey);
      }
      return newSet;
    });
  };

  const expandAllDays = () => {
    setCollapsedDays(new Set());
  };

  const collapseAllDays = () => {
    const allDayKeys = days.map((date) => date.toISOString().split("T")[0]);
    setCollapsedDays(new Set(allDayKeys));
  };

  return (
    <div className='space-y-8 pb-20'>
      {/* Header */}
      <div className='flex items-center justify-between mb-6 px-2 sticky top-0 z-20 bg-slate-950/80 backdrop-blur-md py-4 border-b border-white/5'>
        <h2 className='text-3xl font-bold text-white'>Daily Schedule</h2>
        <div className='flex items-center gap-2'>
          {collapsedDays.size > 0 && (
            <button
              onClick={expandAllDays}
              className='text-xs font-bold text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-full uppercase tracking-wider hover:bg-orange-500/20 transition-colors'
            >
              Expand All
            </button>
          )}
          {collapsedDays.size < days.length && (
            <button
              onClick={collapseAllDays}
              className='text-xs font-bold text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full uppercase tracking-wider hover:bg-slate-700 hover:text-white transition-colors'
            >
              Collapse
            </button>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className='relative pl-4 sm:pl-0'>
        {/* Continuous Line Background - visual guide connecting days */}
        <div className='absolute left-[27px] sm:left-8 top-4 bottom-4 w-0.5 bg-gradient-to-b from-slate-800 via-slate-700 to-slate-800 hidden sm:block' />

        <div className='space-y-12'>
          {days.map((date) => {
            const originalIndex =
              startIndex +
              days.findIndex((d) => d.toDateString() === date.toDateString());
            const dateKey = date.toISOString().split("T")[0];
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
            const isCollapsed = collapsedDays.has(dateKey);
            const isExpanded = expandedDays.has(dateKey);
            const hasManyActivities =
              dayActivities.length > ACTIVITIES_THRESHOLD;
            const visibleActivities =
              hasManyActivities && !isExpanded
                ? dayActivities.slice(0, ACTIVITIES_THRESHOLD)
                : dayActivities;

            return (
              <div key={originalIndex} className='relative group/day'>
                {/* Date Header - Sticky */}
                <div className='sticky top-[72px] z-10 mb-6 -mx-4 px-4 bg-slate-950/95 backdrop-blur-sm py-3 border-y border-white/5 sm:rounded-xl sm:mx-0 sm:border-x shadow-lg'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-4'>
                      {/* Day Number Box */}
                      <div
                        className={`flex flex-col items-center justify-center w-12 h-14 rounded-xl border ${
                          isToday
                            ? "bg-orange-500 border-orange-400 text-white shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                            : "bg-slate-800 border-slate-700 text-slate-400"
                        }`}
                      >
                        <span className='text-xs font-medium uppercase'>
                          {date.toLocaleDateString("en-US", { month: "short" })}
                        </span>
                        <span className='text-xl font-bold leading-none'>
                          {date.getDate()}
                        </span>
                      </div>

                      <div>
                        <div className='flex items-center gap-2'>
                          <h3
                            className={`text-lg font-bold ${
                              isToday ? "text-white" : "text-slate-200"
                            }`}
                          >
                            {date.toLocaleDateString("en-US", {
                              weekday: "long",
                            })}
                          </h3>
                          {isToday && (
                            <span className='px-2 py-0.5 text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-full uppercase tracking-wide'>
                              Today
                            </span>
                          )}
                        </div>
                        <p className='text-sm text-slate-500'>
                          {dayActivities.length} Activities
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleDayCollapse(dateKey)}
                      className='p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-500 hover:text-white'
                    >
                      {isCollapsed ? (
                        <ChevronDown className='w-5 h-5' />
                      ) : (
                        <ChevronUp className='w-5 h-5' />
                      )}
                    </button>
                  </div>
                </div>

                {/* Activities Timeline */}
                {!isCollapsed && (
                  <div className='relative pl-2 sm:pl-6'>
                    {/* Vertical Line Connection */}
                    <div className='absolute left-[19px] sm:left-[39px] top-0 bottom-0 w-0.5 bg-slate-800' />

                    {dayActivities.length === 0 ? (
                      <div className='ml-10 sm:ml-12 py-8 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 text-center'>
                        <p className='text-sm text-slate-500 italic'>
                          No activities planned for this day.
                        </p>
                      </div>
                    ) : (
                      <div className='space-y-4'>
                        {visibleActivities.map((activity, idx) => (
                          <div
                            key={activity.id}
                            className={`relative pl-10 sm:pl-12 group transition-all duration-300 ${
                              onViewActivity ? "cursor-pointer" : ""
                            }`}
                            onClick={() => onViewActivity?.(activity)}
                          >
                            {/* Timeline Dot */}
                            <div
                              className={`absolute left-[15px] sm:left-[35px] top-6 w-2.5 h-2.5 rounded-full border-2 border-slate-950 z-10 transition-colors ${
                                activity.done
                                  ? "bg-slate-600"
                                  : "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]"
                              }`}
                            />

                            {/* Activity Card */}
                            <div
                              className={`rounded-2xl p-4 border transition-all duration-200 ${
                                activity.done
                                  ? "bg-slate-900/40 border-slate-800 opacity-70"
                                  : "bg-slate-800/40 border-white/5 hover:bg-slate-800/80 hover:border-white/10 hover:shadow-lg"
                              }`}
                            >
                              <div className='flex gap-3'>
                                {/* Checkbox / Time Column */}
                                <div className='flex flex-col items-center gap-2 pt-0.5'>
                                  {!readOnly && onToggleDone && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleDone(activity.id);
                                      }}
                                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                        activity.done
                                          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-500"
                                          : "border-slate-600 hover:border-orange-500 text-transparent"
                                      }`}
                                    >
                                      {activity.done && (
                                        <span className='text-xs font-bold'>
                                          ✓
                                        </span>
                                      )}
                                    </button>
                                  )}
                                </div>

                                {/* Content */}
                                <div className='flex-1 min-w-0 space-y-2'>
                                  <div className='flex items-start justify-between gap-2'>
                                    <div>
                                      <h4
                                        className={`font-semibold text-base sm:text-lg leading-tight mb-1 ${
                                          activity.done
                                            ? "text-slate-500 line-through"
                                            : "text-white"
                                        }`}
                                      >
                                        {activity.title}
                                      </h4>
                                      <div className='flex items-center gap-2 text-sm text-slate-400'>
                                        {(activity.startTime ||
                                          activity.pickupTime) && (
                                          <div className='flex items-center gap-1.5 text-orange-400 font-medium bg-orange-500/10 px-2 py-0.5 rounded-md'>
                                            <Clock className='w-3.5 h-3.5' />
                                            <span>
                                              {activity.startTime
                                                ? formatTime12Hour(
                                                    activity.startTime,
                                                  )
                                                : formatTime12Hour(
                                                    activity.pickupTime!,
                                                  )}
                                            </span>
                                          </div>
                                        )}
                                        {activity.transportationMode && (
                                          <span
                                            className='text-sm'
                                            title={activity.transportationMode}
                                          >
                                            {getTransportationIcon(
                                              activity.transportationMode,
                                            )}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    {/* Actions */}
                                    {!readOnly && (
                                      <div className='flex items-center gap-1'>
                                        {onEditActivity && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onEditActivity(activity);
                                            }}
                                            className='p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors'
                                          >
                                            <Pencil className='w-4 h-4' />
                                          </button>
                                        )}
                                        {onDeleteActivity && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onDeleteActivity(activity.id);
                                            }}
                                            className='p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors'
                                          >
                                            <Trash2 className='w-4 h-4' />
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Location / Details */}
                                  {(activity.pickupLocation ||
                                    activity.dropoffLocation) && (
                                    <div className='flex items-start gap-1.5 text-xs sm:text-sm text-slate-400 bg-slate-900/50 p-2 rounded-lg border border-white/5'>
                                      <MapPin className='w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-500' />
                                      <span className='break-words line-clamp-2'>
                                        {activity.pickupLocation ||
                                          activity.dropoffLocation}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Show More/Less Button */}
                        {hasManyActivities && (
                          <div className='flex justify-center pt-2 pl-10 sm:pl-12'>
                            <button
                              onClick={() => toggleDayExpansion(dateKey)}
                              className='flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-orange-400 bg-slate-800 hover:bg-slate-700 border border-white/5 rounded-full transition-all hover:scale-105 shadow-sm'
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className='w-3.5 h-3.5' />
                                  Show Less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className='w-3.5 h-3.5' />+
                                  {dayActivities.length - ACTIVITIES_THRESHOLD}{" "}
                                  more
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='flex items-center justify-center gap-3 pt-8 pb-4'>
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className='px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5 hover:border-white/10 transition-all duration-200 flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md'
          >
            <ChevronLeft className='w-4 h-4' />
            Previous
          </button>
          <span className='px-4 py-2 text-sm font-medium text-slate-400'>
            Page {currentPage} / {totalPages}
          </span>
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className='px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5 hover:border-white/10 transition-all duration-200 flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md'
          >
            Next
            <ChevronRight className='w-4 h-4' />
          </button>
        </div>
      )}
    </div>
  );
};

export default TravelSchedule;
