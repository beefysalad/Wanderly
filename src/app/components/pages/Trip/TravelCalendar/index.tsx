import { Button } from "@/components/ui/button";
import { Activity } from "@/src/shared/types";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import React, { useState } from "react";
import { formatTime12Hour } from "@/lib/utils";

interface ITravelCalendarProps {
  startDate: Date;
  endDate: Date;
  activities: Activity[];
  onAddActivity: (activity: Omit<Activity, "id">) => void;
  onUpdateActivity: (id: string, updates: Partial<Activity>) => void;
  onDeleteActivity: (id: string) => void;
  onToggleDone: (id: string) => void;
  onOpenAddModal: (date: Date) => void;
  onEditActivity: (activity: Activity) => void;
  onViewActivity: (activity: Activity) => void;
}
const TravelCalendar = ({
  activities,
  endDate,
  onOpenAddModal,
  startDate,
  onViewActivity,
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

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold text-slate-900'>
          Calendar Overview
        </h2>
        {totalPages > 1 && (
          <span className='text-sm text-slate-600'>
            Page {currentPage} of {totalPages}
          </span>
        )}
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
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
              // Sort by startTime, activities without time go to the end
              if (!a.startTime && !b.startTime) return 0;
              if (!a.startTime) return 1;
              if (!b.startTime) return -1;
              return a.startTime.localeCompare(b.startTime);
            });

          return (
            <div
              key={index}
              className='bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-lg hover:shadow-xl transition-shadow'
            >
              <div className='flex items-center justify-between mb-3'>
                <div>
                  <p className='font-semibold text-slate-900'>
                    {date.toLocaleDateString("en-US", { weekday: "short" })}
                  </p>
                  <p className='text-sm text-slate-600'>
                    {date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <span className='text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full'>
                  {dayActivities.length} events
                </span>
              </div>

              {dayActivities.length > 0 ? (
                <div className='space-y-2 mb-3'>
                  {dayActivities.slice(0, 3).map((activity) => (
                    <div
                      key={activity.id}
                      className='text-sm p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-orange-300 hover:shadow-sm transition-all cursor-pointer'
                      onClick={() => onViewActivity(activity)}
                    >
                      <p
                        className={`font-medium ${
                          activity.done
                            ? "line-through text-slate-500"
                            : "text-slate-900"
                        }`}
                      >
                        {activity.title}
                      </p>
                      {activity.startTime && (
                        <p className='text-xs text-slate-500 mt-1'>
                          {formatTime12Hour(activity.startTime)}
                          {activity.endTime &&
                            ` - ${formatTime12Hour(activity.endTime)}`}
                        </p>
                      )}
                    </div>
                  ))}
                  {dayActivities.length > 3 && (
                    <p className='text-xs text-slate-500 text-center'>
                      +{dayActivities.length - 3} more
                    </p>
                  )}
                </div>
              ) : (
                <p className='text-sm text-slate-400 text-center py-4'>
                  No events
                </p>
              )}

              <Button
                onClick={() => onOpenAddModal(date)}
                variant='outline'
                size='sm'
                className='w-full text-orange-600 border-orange-200 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600'
              >
                <Plus className='w-4 h-4 mr-1' />
                Add Events
              </Button>
            </div>
          );
        })}
      </div>

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

export default TravelCalendar;
