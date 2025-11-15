import { Button } from "@/components/ui/button";
import { Activity } from "@/src/shared/types";
import { Plus, Pencil, Trash2 } from "lucide-react";
import React from "react";

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
  onAddActivity,
  onDeleteActivity,
  onOpenAddModal,
  onToggleDone,
  onUpdateActivity,
  startDate,
  onEditActivity,
  onViewActivity,
}: ITravelCalendarProps) => {
  const getDaysInRange = () => {
    const days = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const days = getDaysInRange();
  return (
    <div className='space-y-4'>
      <h2 className='text-lg font-semibold text-slate-900'>
        Calendar Overview
      </h2>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
        {days.map((date, index) => {
          const dayActivities = activities.filter((a) => {
            const actDate = new Date(a.date);
            return (
              actDate.getFullYear() === date.getFullYear() &&
              actDate.getMonth() === date.getMonth() &&
              actDate.getDate() === date.getDate()
            );
          });

          return (
            <div
              key={index}
              className='bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow'
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
                <span className='text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full'>
                  {dayActivities.length} events
                </span>
              </div>

              {dayActivities.length > 0 ? (
                <div className='space-y-2 mb-3'>
                  {dayActivities.slice(0, 3).map((activity) => (
                    <div
                      key={activity.id}
                      className='text-sm p-2 bg-slate-50 rounded-lg border border-slate-100 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer'
                      onClick={() => onViewActivity(activity)}
                    >
                      <div className='flex items-start justify-between gap-2'>
                        <div className='flex-1'>
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
                              {activity.startTime}
                              {activity.endTime && ` - ${activity.endTime}`}
                            </p>
                          )}
                        </div>
                        <div
                          className='flex items-center gap-1'
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => onToggleDone(activity.id)}
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                              activity.done
                                ? "bg-green-500 border-green-500 text-white"
                                : "border-slate-300 hover:border-green-500"
                            }`}
                            title={activity.done ? "Mark as incomplete" : "Mark as done"}
                          >
                            {activity.done && (
                              <span className='text-[10px] leading-none'>✓</span>
                            )}
                          </button>
                          <button
                            onClick={() => onEditActivity(activity)}
                            className='p-1.5 hover:bg-blue-50 rounded text-blue-600 hover:text-blue-700 transition-colors'
                            title='Edit activity'
                          >
                            <Pencil className='w-3.5 h-3.5' />
                          </button>
                          <button
                            onClick={() => onDeleteActivity(activity.id)}
                            className='p-1.5 hover:bg-red-50 rounded text-red-600 hover:text-red-700 transition-colors'
                            title='Delete activity'
                          >
                            <Trash2 className='w-3.5 h-3.5' />
                          </button>
                        </div>
                      </div>
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
                className='w-full text-blue-600 border-blue-200 hover:bg-blue-50'
              >
                <Plus className='w-4 h-4 mr-1' />
                Add Event
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TravelCalendar;
