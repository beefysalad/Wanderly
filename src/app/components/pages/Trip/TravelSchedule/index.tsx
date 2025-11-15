import { Button } from "@/components/ui/button";
import { Activity } from "@/src/shared/types";
import { ChevronDown, Trash2 } from "lucide-react";
import React, { useState } from "react";

interface ITravelScheduleProps {
  startDate: Date;
  endDate: Date;
  activities: Activity[];
  onAddActivity: (activity: Omit<Activity, "id">) => void;
  onUpdateActivity: (id: string, updates: Partial<Activity>) => void;
  onDeleteActivity: (id: string) => void;
  onToggleDone: (id: string) => void;
  tripName?: string;
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
}: ITravelScheduleProps) => {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());

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

  const days = getDaysInRange();
  return (
    <div className='space-y-4'>
      {tripName && (
        <div className='bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg p-6 shadow-lg'>
          <h1 className='text-2xl font-bold mb-2'>{tripName}</h1>
          <p className='text-amber-50'>
            {startDate.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}{" "}
            -{" "}
            {endDate.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      )}
      <h2 className='text-lg font-semibold text-slate-900'>Daily Schedule</h2>
      {days.map((date, dayIndex) => {
        const dayActivities = activities.filter((a) => {
          const actDate = new Date(a.date);
          return (
            actDate.getFullYear() === date.getFullYear() &&
            actDate.getMonth() === date.getMonth() &&
            actDate.getDate() === date.getDate()
          );
        });
        const isExpanded = expandedDays.has(dayIndex);

        return (
          <div
            key={dayIndex}
            className='bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow'
          >
            <button
              onClick={() => toggleDay(dayIndex)}
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
                      className='p-4 bg-slate-50 rounded-lg border border-slate-200'
                    >
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          <div className='flex items-center gap-2'>
                            <button
                              onClick={() => onToggleDone(activity.id)}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                activity.done
                                  ? "bg-green-500 border-green-500 text-white"
                                  : "border-slate-300 hover:border-green-500"
                              }`}
                            >
                              {activity.done && (
                                <span className='text-xs'>✓</span>
                              )}
                            </button>
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
                              ⏰ {activity.startTime}
                              {activity.endTime && ` - ${activity.endTime}`}
                            </p>
                          )}
                          {activity.notes && (
                            <p className='text-sm text-slate-600 mt-2 ml-7'>
                              {activity.notes}
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={() => onDeleteActivity(activity.id)}
                          variant='ghost'
                          size='sm'
                          className='text-red-500 hover:text-red-700 hover:bg-red-50'
                        >
                          <Trash2 className='w-4 h-4' />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TravelSchedule;
