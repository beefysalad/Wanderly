"use client";

import { Activity, Expense } from "@/src/shared/types";
import {
  Calendar,
  Clock,
  FileText,
  Pencil,
  Trash2,
  Navigation2,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  Circle,
} from "lucide-react";
import React from "react";
import { formatTime12Hour } from "@/lib/utils";
import { cn } from "@/lib/utils";
import DashboardLayoutHeader from "../../shared/DashboardLayoutHeader";

interface IActivityDetailProps {
  activity: Activity;
  expenses?: Expense[];
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleDone?: () => void;
  onSelectExpense?: (expense: Expense) => void;
  readOnly?: boolean;
}

const ActivityDetail = ({
  activity,
  expenses = [],
  onEdit,
  onDelete,
  onToggleDone,
  onSelectExpense,
  readOnly = false,
}: IActivityDetailProps) => {
  const activityDate = new Date(activity.date);

  // Filter expenses linked to this activity
  const linkedExpenses = expenses.filter(
    (exp) => exp.activityId === activity.id,
  );

  return (
    <div className='min-h-screen bg-slate-950 pb-32 relative overflow-x-hidden font-sans selection:bg-orange-500/30'>
      {/* Immersive Background */}
      <div className='fixed inset-0 z-0 pointer-events-none'>
        <div className='absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-white/[0.02] rounded-full blur-[150px] opacity-40'></div>
        <div className='absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-white/[0.02] rounded-full blur-[150px] opacity-40'></div>
      </div>

      <div className='relative z-20'>
        <DashboardLayoutHeader
          showBack={true}
          rightContent={
            !readOnly && (
              <div className='flex items-center gap-2'>
                <button
                  onClick={() => onEdit && onEdit()}
                  className='p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all'
                  title='Edit Activity'
                >
                  <Pencil className='w-5 h-5' />
                </button>
                <button
                  onClick={() => onDelete && onDelete()}
                  className='p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all'
                  title='Delete Activity'
                >
                  <Trash2 className='w-5 h-5' />
                </button>
              </div>
            )
          }
        />
      </div>

      <div className='max-w-3xl mx-auto relative z-10 px-4 sm:px-6'>
        {/* Title & Status Section */}
        <div className='pt-4 pb-8'>
          <div className='flex flex-col gap-6'>
            {/* Badges */}
            <div className='flex flex-wrap items-center gap-3'>
              <button
                onClick={!readOnly ? onToggleDone : undefined}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border shadow-sm",
                  activity.done
                    ? "bg-emerald-500 text-slate-950 border-emerald-500 hover:bg-emerald-600"
                    : "bg-slate-800 text-orange-400 border-orange-500/30 hover:bg-slate-700",
                )}
              >
                {activity.done ? (
                  <>
                    <CheckCircle2 className='w-3.5 h-3.5' />
                    <span>Completed</span>
                  </>
                ) : (
                  <>
                    <Circle className='w-3.5 h-3.5' />
                    <span>Planned</span>
                  </>
                )}
              </button>

              <span className='px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm'>
                <Calendar className='w-3.5 h-3.5' />
                {activityDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            {/* Title */}
            <div>
              <h1
                className={cn(
                  "text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight mb-2",
                  activity.done &&
                    "text-slate-500 line-through decoration-slate-700 decoration-4",
                )}
              >
                {activity.title}
              </h1>

              {/* Time */}
              {(activity.startTime || activity.endTime) && (
                <div className='inline-flex items-center gap-2 text-lg sm:text-xl font-medium text-orange-400/90'>
                  <Clock className='w-5 h-5' />
                  <span>
                    {activity.startTime && activity.endTime
                      ? `${formatTime12Hour(activity.startTime)} - ${formatTime12Hour(activity.endTime)}`
                      : activity.startTime
                        ? `Starts at ${formatTime12Hour(activity.startTime)}`
                        : `Ends at ${formatTime12Hour(activity.endTime || "")}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Cards */}
        <div className='space-y-6'>
          {/* Notes Card */}
          {activity.notes && (
            <div className='bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-sm'>
              <div className='flex items-center gap-3 mb-4 text-slate-500'>
                <FileText className='w-4 h-4' />
                <span className='text-xs font-bold uppercase tracking-widest'>
                  Notes
                </span>
              </div>
              <p className='text-base text-slate-300 leading-relaxed whitespace-pre-wrap font-medium'>
                {activity.notes}
              </p>
            </div>
          )}

          {/* Transportation Card */}
          {(activity.transportationMode ||
            activity.pickupTime ||
            activity.pickupLocation ||
            activity.dropoffLocation) && (
            <div className='bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-sm relative overflow-hidden group'>
              {/* Decorative Icon */}
              <div className='absolute -right-6 -top-6 text-slate-800/50 transform rotate-12 group-hover:rotate-0 transition-transform duration-700 pointer-events-none'>
                <Navigation2 className='w-32 h-32' />
              </div>

              <div className='relative z-10'>
                <div className='flex items-center gap-3 mb-6 text-blue-500'>
                  <Navigation2 className='w-4 h-4' />
                  <span className='text-xs font-bold uppercase tracking-widest'>
                    Journey Details
                  </span>
                </div>

                <div className='grid gap-8'>
                  {activity.transportationMode && (
                    <div className='flex items-center gap-4'>
                      <div className='w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center text-2xl border border-white/5 shadow-inner'>
                        {activity.transportationMode === "car" && "🚗"}
                        {activity.transportationMode === "bus" && "🚌"}
                        {activity.transportationMode === "plane" && "✈️"}
                        {activity.transportationMode === "train" && "🚊"}
                        {activity.transportationMode === "taxi" && "🚕"}
                        {activity.transportationMode === "walking" && "🚶"}
                        {activity.transportationMode === "commute" && "🚌"}
                      </div>
                      <div>
                        <p className='text-xs text-slate-500 font-bold uppercase tracking-wide mb-0.5'>
                          Mode
                        </p>
                        <p className='text-lg font-bold text-white capitalize'>
                          {activity.transportationMode}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Locations Flow */}
                  <div className='relative pl-4 space-y-8'>
                    {/* Vertical Line */}
                    {activity.pickupLocation && activity.dropoffLocation && (
                      <div className='absolute left-[21px] top-3 bottom-8 w-0.5 bg-slate-800' />
                    )}

                    {(activity.pickupLocation || activity.pickupTime) && (
                      <div className='relative flex gap-4'>
                        <div className='flex flex-col items-center pt-1'>
                          <div className='w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-slate-900/50' />
                        </div>
                        <div>
                          <p className='text-xs text-slate-500 font-bold uppercase mb-1'>
                            {activity.transportationMode === "plane"
                              ? "Departure"
                              : "Pickup"}
                          </p>
                          <p className='text-base font-medium text-white'>
                            {activity.pickupLocation || "No location set"}
                          </p>
                          {activity.pickupTime && (
                            <p className='text-sm text-blue-400 font-medium mt-1 bg-blue-500/10 inline-block px-2 py-0.5 rounded-md'>
                              {formatTime12Hour(activity.pickupTime)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {activity.dropoffLocation && (
                      <div className='relative flex gap-4'>
                        <div className='flex flex-col items-center pt-1'>
                          <div className='w-2.5 h-2.5 rounded-full bg-orange-500 ring-4 ring-slate-900/50' />
                        </div>
                        <div>
                          <p className='text-xs text-slate-500 font-bold uppercase mb-1'>
                            {activity.transportationMode === "plane"
                              ? "Arrival"
                              : "Dropoff"}
                          </p>
                          <p className='text-base font-medium text-white'>
                            {activity.dropoffLocation}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Linked Expenses */}
          {linkedExpenses.length > 0 && (
            <div className='bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-sm'>
              <div className='flex items-center justify-between mb-6'>
                <div className='flex items-center gap-3 text-emerald-500'>
                  <DollarSign className='w-4 h-4' />
                  <span className='text-xs font-bold uppercase tracking-widest'>
                    Linked Expenses
                  </span>
                </div>
                <span className='bg-emerald-500 text-slate-950 px-2.5 py-1 rounded-full text-[10px] font-black border border-emerald-500 shadow-sm'>
                  {linkedExpenses.length}
                </span>
              </div>

              <div className='grid gap-3'>
                {linkedExpenses.map((expense) => (
                  <button
                    key={expense.id}
                    onClick={() => onSelectExpense?.(expense)}
                    className='flex items-center justify-between w-full bg-slate-800 hover:bg-slate-700/50 p-4 rounded-xl transition-all border border-slate-700 hover:border-emerald-500 group text-left shadow-sm'
                  >
                    <div className='min-w-0 pr-4'>
                      <p className='font-bold text-white group-hover:text-emerald-400 transition-colors truncate text-sm'>
                        {expense.description}
                      </p>
                      <p className='text-xs text-slate-500 mt-0.5'>
                        Paid by {expense.paidBy.split("@")[0]}
                      </p>
                    </div>
                    <div className='text-right whitespace-nowrap'>
                      <p className='font-bold text-emerald-400 text-sm'>
                        ₱{expense.amount.toFixed(2)}
                      </p>
                      <div className='flex items-center justify-end gap-1 text-[10px] text-slate-600 mt-1 uppercase font-bold tracking-wider group-hover:text-emerald-500/70 transition-colors'>
                        <span>View</span>
                        <ArrowRight className='w-3 h-3' />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button for Complete */}
      {!readOnly && onToggleDone && (
        <div className='fixed bottom-6 left-0 right-0 px-4 flex justify-center z-50 pointer-events-none'>
          <button
            onClick={onToggleDone}
            className={cn(
              "pointer-events-auto px-8 py-4 rounded-full font-bold text-sm sm:text-base transition-all transform active:scale-[0.98] shadow-xl flex items-center justify-center gap-3 border",
              activity.done
                ? "bg-slate-800 text-slate-400 hover:bg-slate-700 border-slate-700 shadow-black/40"
                : "bg-orange-500 text-white hover:bg-orange-600 border-orange-400 shadow-orange-500/20",
            )}
          >
            {activity.done ? (
              <>
                <Circle className='w-4 h-4' />
                <span>Mark as Incomplete</span>
              </>
            ) : (
              <>
                <CheckCircle2 className='w-4 h-4' />
                <span>Complete Activity</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityDetail;
