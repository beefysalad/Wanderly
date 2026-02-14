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
    <div className='space-y-8'>
      {/* Header */}
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-3xl sm:text-4xl font-bold text-white'>
          Daily Schedule
        </h2>
        <div className='flex items-center gap-3'>
          {collapsedDays.size > 0 && (
            <button
              onClick={expandAllDays}
              className='text-xs font-medium text-orange-400 hover:text-orange-300 px-3 py-1.5 rounded-lg hover:bg-orange-500/10 transition-colors'
            >
              Expand All
            </button>
          )}
          {collapsedDays.size < days.length && (
            <button
              onClick={collapseAllDays}
              className='text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors'
            >
              Collapse All
            </button>
          )}
          {totalPages > 1 && (
            <span className='text-sm font-medium text-slate-500'>
              Page {currentPage} of {totalPages}
            </span>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className='space-y-6'>
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
          const hasManyActivities = dayActivities.length > ACTIVITIES_THRESHOLD;
          const visibleActivities =
            hasManyActivities && !isExpanded
              ? dayActivities.slice(0, ACTIVITIES_THRESHOLD)
              : dayActivities;

          return (
            <div key={originalIndex} className='relative'>
              {/* Date Header */}
              <div className='mb-5'>
                <div className='flex items-center gap-4'>
                  <div className='relative flex-shrink-0'>
                    <div
                      className={`w-1.5 h-14 rounded-full ${
                        isToday
                          ? "bg-gradient-to-b from-orange-500 via-orange-400 to-amber-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]"
                          : "bg-slate-700"
                      }`}
                    />
                    {isToday && (
                      <div className='absolute -left-1 top-0 w-3.5 h-3.5 bg-orange-500 rounded-full border-2 border-slate-900 shadow-lg animate-pulse' />
                    )}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2.5 mb-1'>
                      <h3
                        className={`text-xl sm:text-2xl font-bold ${isToday ? "text-white" : "text-slate-200"}`}
                      >
                        {date.toLocaleDateString("en-US", {
                          weekday: "long",
                        })}
                      </h3>
                      {isToday && (
                        <span className='px-2.5 py-1 text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-full shadow-sm'>
                          Today
                        </span>
                      )}
                    </div>
                    <p className='text-sm font-medium text-slate-500'>
                      {date.toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className='px-3 py-1.5 text-xs font-bold text-slate-400 bg-slate-800 border border-white/5 rounded-full'>
                      {dayActivities.length}
                    </span>
                    <button
                      onClick={() => toggleDayCollapse(dateKey)}
                      className='p-2 hover:bg-slate-800 rounded-lg transition-all text-slate-500 hover:text-white'
                      title={
                        isCollapsed
                          ? "Expand activities"
                          : "Collapse activities"
                      }
                    >
                      {isCollapsed ? (
                        <ChevronDown className='w-4 h-4' />
                      ) : (
                        <ChevronUp className='w-4 h-4' />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Activities Timeline */}
              {!isCollapsed && (
                <>
                  {dayActivities.length === 0 ? (
                    <div className='ml-6 pl-5 border-l-2 border-dashed border-slate-700'>
                      <div className='py-8 text-center'>
                        <p className='text-sm font-medium text-slate-500'>
                          No activities scheduled
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className='ml-6 space-y-3'>
                      {visibleActivities.map((activity, idx) => (
                        <div
                          key={activity.id}
                          className={`relative pl-5 ${
                            idx < visibleActivities.length - 1
                              ? `border-l ${
                                  activity.done
                                    ? "border-slate-700/50"
                                    : "border-orange-500/30"
                                } pb-3`
                              : ""
                          } ${onViewActivity ? "cursor-pointer" : ""} group`}
                          onClick={() => onViewActivity?.(activity)}
                        >
                          {/* Timeline Dot */}
                          <div
                            className={`absolute -left-[5px] top-6 w-2.5 h-2.5 rounded-full transition-all z-10 ${
                              activity.done
                                ? "bg-slate-700"
                                : "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]"
                            }`}
                          />

                          {/* Activity Card */}
                          <div
                            className={`rounded-2xl p-4 border transition-all duration-300 ${
                              activity.done
                                ? "border-slate-800 bg-slate-900/50 opacity-60"
                                : "border-white/5 bg-slate-800/40 hover:bg-slate-800/60 hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/5"
                            }`}
                          >
                            <div className='flex items-start justify-between gap-3'>
                              <div className='flex-1 min-w-0'>
                                {/* Title and Status */}
                                <div className='flex items-start gap-3 mb-2'>
                                  {!readOnly && onToggleDone && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleDone(activity.id);
                                      }}
                                      className={`flex-shrink-0 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-200 mt-0.5 ${
                                        activity.done
                                          ? "bg-slate-700 border-slate-700 text-slate-400"
                                          : "border-slate-600 hover:border-orange-500 text-transparent hover:text-orange-500/50"
                                      }`}
                                    >
                                      {activity.done && (
                                        <span className='text-[10px] font-bold'>
                                          ✓
                                        </span>
                                      )}
                                    </button>
                                  )}
                                  {readOnly && (
                                    <div
                                      className={`flex-shrink-0 w-5 h-5 rounded-lg border-2 flex items-center justify-center mt-0.5 ${
                                        activity.done
                                          ? "bg-slate-700 border-slate-700 text-slate-400"
                                          : "bg-slate-800 border-slate-600"
                                      }`}
                                    >
                                      {activity.done && (
                                        <span className='text-[10px] font-bold'>
                                          ✓
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  <div className='flex-1 min-w-0'>
                                    <h4
                                      className={`text-base font-bold mb-2 leading-tight ${
                                        activity.done
                                          ? "line-through text-slate-500"
                                          : "text-white group-hover:text-orange-100"
                                      }`}
                                    >
                                      {activity.title}
                                    </h4>

                                    {/* Time, Transportation, Location - Horizontal */}
                                    <div className='flex items-center gap-2 flex-wrap'>
                                      {(activity.startTime ||
                                        activity.pickupTime) && (
                                        <span className='inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-orange-300 bg-orange-500/10 border border-orange-500/20 rounded-md'>
                                          <Clock className='w-3 h-3' />
                                          {activity.startTime
                                            ? formatTime12Hour(
                                                activity.startTime,
                                              )
                                            : formatTime12Hour(
                                                activity.pickupTime!,
                                              )}
                                        </span>
                                      )}
                                      {activity.transportationMode && (
                                        <span className='text-sm bg-slate-800 border border-white/5 px-2 py-0.5 rounded-md'>
                                          {getTransportationIcon(
                                            activity.transportationMode,
                                          )}
                                        </span>
                                      )}
                                      {(activity.pickupLocation ||
                                        activity.dropoffLocation) && (
                                        <span className='text-xs text-slate-400 flex items-center gap-1 truncate max-w-[200px] bg-slate-800/50 px-2 py-1 rounded-md'>
                                          <MapPin className='w-3 h-3 flex-shrink-0 text-slate-500' />
                                          <span className='truncate'>
                                            {activity.pickupLocation ||
                                              activity.dropoffLocation}
                                          </span>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Actions */}
                              {!readOnly && (
                                <div
                                  className='flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity'
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {onEditActivity && (
                                    <Button
                                      onClick={() => onEditActivity(activity)}
                                      variant='ghost'
                                      size='sm'
                                      className='text-slate-400 hover:text-white hover:bg-white/10 h-8 w-8 p-0 rounded-lg'
                                      title='Edit'
                                    >
                                      <Pencil className='w-4 h-4' />
                                    </Button>
                                  )}
                                  {onDeleteActivity && (
                                    <Button
                                      onClick={() =>
                                        onDeleteActivity(activity.id)
                                      }
                                      variant='ghost'
                                      size='sm'
                                      className='text-slate-400 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0 rounded-lg'
                                      title='Delete'
                                    >
                                      <Trash2 className='w-4 h-4' />
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Show More/Less Button */}
                      {hasManyActivities && (
                        <div className='flex justify-center pt-2'>
                          <button
                            onClick={() => toggleDayExpansion(dateKey)}
                            className='flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-orange-400 bg-slate-800 hover:bg-slate-700 border border-white/5 rounded-full transition-all hover:scale-105'
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
                </>
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

export default TravelSchedule;
