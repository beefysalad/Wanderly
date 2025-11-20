import { Button } from "@/components/ui/button";
import { Activity } from "@/src/shared/types";
import { Plus, ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Calendar Overview</h2>
        {totalPages > 1 && (
          <span className="text-sm font-medium text-slate-500">
            Page {currentPage} of {totalPages}
          </span>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
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

          const isToday =
            date.toDateString() === new Date().toDateString();

          return (
            <div
              key={index}
              className={`bg-white rounded-xl p-4 sm:p-5 border transition-all duration-200 ${
                isToday
                  ? "border-orange-300 shadow-md"
                  : "border-slate-200 shadow-sm hover:shadow-md"
              }`}
            >
              {/* Date Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">
                    {date.toLocaleDateString("en-US", { weekday: "short" })}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 leading-none">
                      {date.toLocaleDateString("en-US", { day: "numeric" })}
                    </p>
                    <p className="text-sm font-medium text-slate-600">
                      {date.toLocaleDateString("en-US", { month: "short" })}
                    </p>
                    {isToday && (
                      <span className="px-2 py-0.5 text-xs font-semibold text-orange-600 bg-orange-50 rounded-full">
                        Today
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      dayActivities.length > 0
                        ? "bg-orange-500 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {dayActivities.length}
                  </span>
                </div>
              </div>

              {/* Activities - Compact List */}
              {dayActivities.length > 0 ? (
                <div className="space-y-0.5 mb-4">
                  {dayActivities.slice(0, 5).map((activity, idx) => (
                    <div
                      key={activity.id}
                      className={`py-2.5 px-2 rounded-lg transition-colors ${
                        activity.done
                          ? "opacity-60"
                          : onViewActivity
                          ? "hover:bg-slate-50 cursor-pointer"
                          : ""
                      } ${
                        idx < dayActivities.slice(0, 5).length - 1
                          ? "border-b border-slate-100"
                          : ""
                      }`}
                      onClick={() => onViewActivity?.(activity)}
                    >
                      <div className="flex items-center gap-2.5">
                        {/* Transportation Icon - Small */}
                        {activity.transportationMode && (
                          <span className="text-base flex-shrink-0">
                            {getTransportationIcon(activity.transportationMode)}
                          </span>
                        )}
                        
                        {/* Title and Time - Inline */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p
                              className={`text-sm font-semibold flex-1 min-w-0 ${
                                activity.done
                                  ? "line-through text-slate-400"
                                  : "text-slate-900"
                              }`}
                            >
                              {activity.title}
                            </p>
                            {(activity.startTime || activity.pickupTime) && (
                              <span className="text-xs font-medium text-slate-500 flex items-center gap-1 flex-shrink-0">
                                <Clock className="w-3 h-3" />
                                {activity.startTime
                                  ? formatTime12Hour(activity.startTime)
                                  : activity.pickupTime
                                  ? formatTime12Hour(activity.pickupTime)
                                  : ""}
                              </span>
                            )}
                          </div>
                          {/* Location - Inline if exists */}
                          {(activity.pickupLocation || activity.dropoffLocation) && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              <span className="text-xs text-slate-500 truncate">
                                {activity.pickupLocation || activity.dropoffLocation}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Done Indicator */}
                        {activity.done && (
                          <span className="flex-shrink-0 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
                            <span className="text-[8px] text-white font-bold">✓</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {dayActivities.length > 5 && (
                    <div className="pt-2 text-center">
                      <span className="text-xs font-medium text-slate-500">
                        +{dayActivities.length - 5} more
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm font-medium text-slate-400">
                    No events
                  </p>
                </div>
              )}

              {/* Add Button */}
              {!readOnly && onOpenAddModal && (
                <Button
                  onClick={() => onOpenAddModal(date)}
                  variant="outline"
                  size="sm"
                  className="w-full text-sm font-medium text-orange-600 border border-orange-200 hover:bg-orange-50 hover:border-orange-300 py-2"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Event
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-6">
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 transition-all duration-200 flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <span className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-50 rounded-xl">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 transition-all duration-200 flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default TravelCalendar;
