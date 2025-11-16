import { Button } from "@/components/ui/button";
import { Activity } from "@/src/shared/types";
import {
  ChevronDown,
  Trash2,
  Pencil,
  ChevronLeft,
  ChevronRight,
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
  onAddActivity,
  onDeleteActivity,
  onToggleDone,
  onUpdateActivity,
  startDate,
  tripName,
  onEditActivity,
  onViewActivity,
  readOnly = false,
}: ITravelScheduleProps) => {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const daysPerPage = 7; // Show 7 days per page

  const getDaysInRange = () => {
    const days = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const toggleDay = (dayIndex: number) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayIndex)) {
      newExpanded.delete(dayIndex);
    } else {
      newExpanded.add(dayIndex);
    }
    setExpandedDays(newExpanded);
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
  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold text-slate-900'>Daily Schedule</h2>
        {totalPages > 1 && (
          <span className='text-sm text-slate-600'>
            Page {currentPage} of {totalPages}
          </span>
        )}
      </div>
      {days.map((date, dayIndex) => {
        // Use the original index for expandedDays tracking
        const originalIndex = startIndex + dayIndex;
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
            // Sort by startTime, activities without time go to the end
            if (!a.startTime && !b.startTime) return 0;
            if (!a.startTime) return 1;
            if (!b.startTime) return -1;
            return a.startTime.localeCompare(b.startTime);
          });
        const isExpanded = expandedDays.has(originalIndex);

        return (
          <div
            key={originalIndex}
            className='bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-shadow'
          >
            <button
              onClick={() => toggleDay(originalIndex)}
              className='w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors'
            >
              <div className='flex items-center gap-4'>
                <ChevronDown
                  className={`w-5 h-5 text-slate-600 transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
                <div className='text-left'>
                  <div className='font-semibold text-slate-900'>
                    {date.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className='text-sm text-slate-500'>
                    {dayActivities.length}{" "}
                    {dayActivities.length === 1 ? "activity" : "activities"}
                  </div>
                </div>
              </div>
            </button>

            {isExpanded && (
              <div className='px-6 pb-4 space-y-3'>
                {dayActivities.length === 0 ? (
                  <p className='text-center text-slate-400 py-4'>
                    No activities for this day
                  </p>
                ) : (
                  dayActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className={`p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-orange-300 hover:shadow-sm transition-all ${
                        onViewActivity ? "cursor-pointer" : ""
                      }`}
                      onClick={() => onViewActivity?.(activity)}
                    >
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          <div className='flex items-center gap-2'>
                            {!readOnly && onToggleDone && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleDone(activity.id);
                                }}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                  activity.done
                                    ? "bg-orange-500 border-orange-500 text-white"
                                    : "border-slate-300 hover:border-orange-500"
                                }`}
                              >
                                {activity.done && (
                                  <span className='text-xs'>✓</span>
                                )}
                              </button>
                            )}
                            {readOnly && (
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                  activity.done
                                    ? "bg-orange-500 text-white"
                                    : "bg-slate-200"
                                }`}
                              >
                                {activity.done && (
                                  <span className='text-xs'>✓</span>
                                )}
                              </span>
                            )}
                            <h4
                              className={`font-medium ${
                                activity.done
                                  ? "line-through text-slate-500"
                                  : "text-slate-900"
                              }`}
                            >
                              {activity.title}
                            </h4>
                          </div>
                          {activity.startTime && (
                            <p className='text-sm text-slate-600 mt-2 ml-7'>
                              ⏰ {formatTime12Hour(activity.startTime)}
                              {activity.endTime &&
                                ` - ${formatTime12Hour(activity.endTime)}`}
                            </p>
                          )}
                          {activity.transportationMode && (
                            <div className='flex items-center gap-2 mt-2 ml-7'>
                              <span className='text-base'>
                                {activity.transportationMode === "car" && "🚗"}
                                {activity.transportationMode === "bus" && "🚌"}
                                {activity.transportationMode === "plane" && "✈️"}
                                {activity.transportationMode === "train" && "🚊"}
                                {activity.transportationMode === "taxi" && "🚕"}
                                {activity.transportationMode === "walking" && "🚶"}
                                {activity.transportationMode === "commute" && "🚌"}
                                {!["car", "bus", "plane", "train", "taxi", "walking", "commute"].includes(activity.transportationMode) && "🚗"}
                              </span>
                              <span className='text-sm text-slate-600'>
                                {activity.transportationMode.charAt(0).toUpperCase() + activity.transportationMode.slice(1)}
                                {activity.pickupTime && (
                                  <span>
                                    {" "}•{" "}
                                    {activity.transportationMode === "plane"
                                      ? `Departure: ${formatTime12Hour(activity.pickupTime)}`
                                      : `Pickup: ${formatTime12Hour(activity.pickupTime)}`}
                                  </span>
                                )}
                              </span>
                            </div>
                          )}
                          {activity.notes && (
                            <p className='text-sm text-slate-600 mt-2 ml-7 line-clamp-2'>
                              {activity.notes}
                            </p>
                          )}
                        </div>
                        {!readOnly && (
                          <div
                            className='flex items-center gap-1'
                            onClick={(e) => e.stopPropagation()}
                          >
                            {onEditActivity && (
                              <Button
                                onClick={() => onEditActivity(activity)}
                                variant='ghost'
                                size='sm'
                                className='text-orange-500 hover:text-orange-700 hover:bg-orange-50'
                                title='Edit activity'
                              >
                                <Pencil className='w-4 h-4' />
                              </Button>
                            )}
                            {onDeleteActivity && (
                              <Button
                                onClick={() => onDeleteActivity(activity.id)}
                                variant='ghost'
                                size='sm'
                                className='text-red-500 hover:text-red-700 hover:bg-red-50'
                                title='Delete activity'
                              >
                                <Trash2 className='w-4 h-4' />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}

      {totalPages > 1 && (
        <div className='flex items-center justify-center gap-2 pt-4'>
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className='px-4 py-2 rounded-lg bg-white/90 backdrop-blur-sm hover:bg-white text-slate-700 border border-slate-200/50 hover:border-slate-300 transition-all flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md'
          >
            <ChevronLeft className='w-4 h-4' />
            Previous
          </button>
          <span className='px-4 py-2 text-sm font-medium text-slate-600'>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className='px-4 py-2 rounded-lg bg-white/90 backdrop-blur-sm hover:bg-white text-slate-700 border border-slate-200/50 hover:border-slate-300 transition-all flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md'
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
