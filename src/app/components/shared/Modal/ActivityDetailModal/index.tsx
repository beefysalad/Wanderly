import { Activity } from "@/src/shared/types";
import { Calendar, Clock, FileText, Pencil, Trash2, X } from "lucide-react";
import React from "react";
import { formatTime12Hour } from "@/lib/utils";

interface IActivityDetailModal {
  activity: Activity;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleDone?: () => void;
  readOnly?: boolean;
}

const ActivityDetailModal = ({
  activity,
  onClose,
  onEdit,
  onDelete,
  onToggleDone,
  readOnly = false,
}: IActivityDetailModal) => {
  const activityDate = new Date(activity.date);

  return (
    <div
      className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50'
      onClick={onClose}
    >
      <div
        className='bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='sticky top-0 bg-gradient-to-r from-orange-600 to-orange-700 p-6 rounded-t-2xl'>
          <div className='flex items-start justify-between mb-4'>
            <div className='flex-1'>
              <div className='flex items-center gap-3 mb-2'>
                <div
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${
                    activity.done
                      ? "bg-orange-500 border-orange-500 text-white"
                      : "bg-white/20 border-white/30 text-white"
                  }`}
                >
                  {activity.done ? (
                    <span className='text-xl'>✓</span>
                  ) : (
                    <span className='text-xl'>○</span>
                  )}
                </div>
                <div>
                  <h2
                    className={`text-2xl font-bold text-white ${
                      activity.done ? "line-through opacity-75" : ""
                    }`}
                  >
                    {activity.title}
                  </h2>
                  <p className='text-orange-100 text-sm'>
                    {activityDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              {!readOnly && onEdit && (
                <button
                  onClick={onEdit}
                  className='p-2 hover:bg-white/20 rounded-full transition-colors text-white'
                  title='Edit activity'
                >
                  <Pencil className='w-5 h-5' />
                </button>
              )}
              {!readOnly && onDelete && (
                <button
                  onClick={onDelete}
                  className='p-2 hover:bg-white/20 rounded-full transition-colors text-white'
                  title='Delete activity'
                >
                  <Trash2 className='w-5 h-5' />
                </button>
              )}
              <button
                onClick={onClose}
                className='p-2 hover:bg-white/20 rounded-full transition-colors text-white'
              >
                <X className='w-5 h-5' />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className='p-6 space-y-6'>
          {/* Time Range */}
          {(activity.startTime || activity.endTime) && (
            <div className='flex items-start gap-3'>
              <Clock className='w-5 h-5 text-slate-400 mt-0.5' />
              <div>
                <p className='text-sm font-medium text-slate-500 dark:text-slate-400 mb-1'>
                  Time
                </p>
                <p className='text-slate-900 dark:text-white'>
                  {activity.startTime && activity.endTime
                    ? `${formatTime12Hour(
                        activity.startTime
                      )} - ${formatTime12Hour(activity.endTime)}`
                    : activity.startTime
                    ? `Starts at ${formatTime12Hour(activity.startTime)}`
                    : `Ends at ${formatTime12Hour(activity.endTime || "")}`}
                </p>
              </div>
            </div>
          )}

          {/* Date */}
          <div className='flex items-start gap-3'>
            <Calendar className='w-5 h-5 text-slate-400 mt-0.5' />
            <div>
              <p className='text-sm font-medium text-slate-500 dark:text-slate-400 mb-1'>
                Date
              </p>
              <p className='text-slate-900 dark:text-white'>
                {activityDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Notes */}
          {activity.notes ? (
            <div className='flex items-start gap-3'>
              <FileText className='w-5 h-5 text-slate-400 mt-0.5' />
              <div className='flex-1'>
                <p className='text-sm font-medium text-slate-500 dark:text-slate-400 mb-2'>
                  Notes
                </p>
                <p className='text-slate-900 dark:text-white whitespace-pre-wrap'>
                  {activity.notes}
                </p>
              </div>
            </div>
          ) : (
            <div className='flex items-start gap-3'>
              <FileText className='w-5 h-5 text-slate-400 mt-0.5' />
              <div>
                <p className='text-sm font-medium text-slate-500 dark:text-slate-400 mb-1'>
                  Notes
                </p>
                <p className='text-slate-400 italic'>No notes added</p>
              </div>
            </div>
          )}

          {/* Status */}
          {!readOnly && onToggleDone && (
            <div className='pt-4 border-t border-slate-200 dark:border-slate-700'>
              <button
                onClick={onToggleDone}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                  activity.done
                    ? "bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/30"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                {activity.done ? "✓ Mark as Incomplete" : "Mark as Done"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityDetailModal;
