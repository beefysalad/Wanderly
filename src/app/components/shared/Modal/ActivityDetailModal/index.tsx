import { Activity, Expense } from "@/src/shared/types";
import {
  Calendar,
  Clock,
  FileText,
  Pencil,
  Trash2,
  X,
  Navigation2,
  MapPin,
  DollarSign,
  Link2,
} from "lucide-react";
import React from "react";
import { formatTime12Hour } from "@/lib/utils";

interface IActivityDetailModal {
  activity: Activity;
  expenses?: Expense[]; // expenses from the trip
  tripId?: string; // tripId to fetch expenses if not provided
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleDone?: () => void;
  onSelectExpense?: (expense: Expense) => void; // callback when clicking on expense
  readOnly?: boolean;
}

const ActivityDetailModal = ({
  activity,
  expenses = [],
  tripId,
  onClose,
  onEdit,
  onDelete,
  onToggleDone,
  onSelectExpense,
  readOnly = false,
}: IActivityDetailModal) => {
  const activityDate = new Date(activity.date);

  // Filter expenses linked to this activity
  const linkedExpenses = expenses.filter(
    (exp) => exp.activityId === activity.id
  );

  return (
    <div
      className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 pb-40 md:pb-8'
      onClick={onClose}
    >
      <div
        className='bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-md w-full max-h-[calc(100vh-12rem)] md:max-h-[75vh] flex flex-col overflow-hidden'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div className='bg-gradient-to-r from-orange-600 to-orange-700 p-6 rounded-t-lg flex-shrink-0'>
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

        {/* Content - Scrollable */}
        <div className='flex-1 overflow-y-auto p-6 space-y-6'>
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

          {/* Transportation Details */}
          {(activity.transportationMode ||
            activity.pickupTime ||
            activity.pickupLocation ||
            activity.dropoffLocation) && (
            <div className='bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4 border border-slate-200 dark:border-slate-600'>
              <div className='flex items-center gap-2 mb-3'>
                <Navigation2 className='w-5 h-5 text-orange-600' />
                <p className='text-sm font-semibold text-slate-900 dark:text-white'>
                  Transportation Details
                </p>
              </div>
              <div className='space-y-3'>
                {activity.transportationMode && (
                  <div className='flex items-center gap-2'>
                    <span className='text-xl'>
                      {activity.transportationMode === "car" && "🚗"}
                      {activity.transportationMode === "bus" && "🚌"}
                      {activity.transportationMode === "plane" && "✈️"}
                      {activity.transportationMode === "train" && "🚊"}
                      {activity.transportationMode === "taxi" && "🚕"}
                      {activity.transportationMode === "walking" && "🚶"}
                      {activity.transportationMode === "commute" && "🚌"}
                      {![
                        "car",
                        "bus",
                        "plane",
                        "train",
                        "taxi",
                        "walking",
                        "commute",
                      ].includes(activity.transportationMode) && "🚗"}
                    </span>
                    <p className='text-slate-900 dark:text-white font-medium'>
                      {activity.transportationMode.charAt(0).toUpperCase() +
                        activity.transportationMode.slice(1)}
                    </p>
                  </div>
                )}
                {activity.pickupTime && (
                  <div className='flex items-start gap-3'>
                    <Clock className='w-4 h-4 text-slate-400 mt-0.5' />
                    <div>
                      <p className='text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5'>
                        {activity.transportationMode === "plane"
                          ? "Departure Time"
                          : "Pickup Time"}
                      </p>
                      <p className='text-slate-900 dark:text-white'>
                        {formatTime12Hour(activity.pickupTime)}
                      </p>
                    </div>
                  </div>
                )}
                {activity.pickupLocation && (
                  <div className='flex items-start gap-3'>
                    <MapPin className='w-4 h-4 text-slate-400 mt-0.5' />
                    <div>
                      <p className='text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5'>
                        {activity.transportationMode === "plane"
                          ? "Departure Airport"
                          : "Pickup Location"}
                      </p>
                      <p className='text-slate-900 dark:text-white'>
                        {activity.pickupLocation}
                      </p>
                    </div>
                  </div>
                )}
                {activity.dropoffLocation && (
                  <div className='flex items-start gap-3'>
                    <MapPin className='w-4 h-4 text-slate-400 mt-0.5' />
                    <div>
                      <p className='text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5'>
                        {activity.transportationMode === "plane"
                          ? "Arrival Airport"
                          : "Dropoff Location"}
                      </p>
                      <p className='text-slate-900 dark:text-white'>
                        {activity.dropoffLocation}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

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

          {/* Linked Expenses */}
          {linkedExpenses.length > 0 && (
            <div className='pt-4 border-t border-slate-200 dark:border-slate-700'>
              <div className='flex items-center gap-2 mb-3'>
                <DollarSign className='w-5 h-5 text-emerald-600 dark:text-emerald-400' />
                <p className='text-sm font-semibold text-slate-900 dark:text-white'>
                  Linked Expenses ({linkedExpenses.length})
                </p>
              </div>
              <div className='space-y-2'>
                {linkedExpenses.map((expense) => {
                  const Component = onSelectExpense ? "button" : "div";
                  const onClick = onSelectExpense
                    ? () => {
                        onSelectExpense(expense);
                        onClose();
                      }
                    : undefined;

                  return (
                    <Component
                      key={expense.id}
                      onClick={onClick}
                      className={`w-full text-left p-3 rounded-lg border ${
                        onSelectExpense
                          ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 cursor-pointer transition-colors"
                          : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                      }`}
                    >
                      <div className='flex items-start justify-between gap-3'>
                        <div className='flex-1 min-w-0'>
                          <p className='font-medium text-slate-900 dark:text-white text-sm truncate'>
                            {expense.description}
                          </p>
                          <div className='flex items-center gap-2 mt-1 text-xs text-slate-600 dark:text-slate-400'>
                            <span>₱{expense.amount.toFixed(2)}</span>
                            <span>•</span>
                            <span>{expense.paidBy.split("@")[0]}</span>
                          </div>
                        </div>
                        <div className='flex-shrink-0'>
                          <Link2 className='w-4 h-4 text-emerald-600 dark:text-emerald-400' />
                        </div>
                      </div>
                    </Component>
                  );
                })}
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
