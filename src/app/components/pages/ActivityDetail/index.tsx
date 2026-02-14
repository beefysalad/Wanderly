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
  Link2,
  ArrowLeft,
  CheckCircle2,
  Circle,
  MoreVertical,
} from "lucide-react";
import React, { useState } from "react";
import { formatTime12Hour } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

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
  const router = useRouter();
  const activityDate = new Date(activity.date);
  const [showMenu, setShowMenu] = useState(false);

  // Filter expenses linked to this activity
  const linkedExpenses = expenses.filter(
    (exp) => exp.activityId === activity.id,
  );

  return (
    <div className='min-h-screen bg-slate-950 pb-24 relative overflow-x-hidden font-sans selection:bg-orange-500/30'>
      {/* Immersive Background */}
      <div className='fixed inset-0 z-0 pointer-events-none'>
        <div className='absolute top-[-20%] left-[-20%] w-[70%] h-[70%] bg-orange-500/10 rounded-full blur-[120px] opacity-60'></div>
        <div className='absolute bottom-[-20%] right-[-20%] w-[70%] h-[70%] bg-purple-500/10 rounded-full blur-[120px] opacity-60'></div>
      </div>

      <div className='max-w-3xl mx-auto relative z-10'>
        {/* Navigation & Actions Header */}
        <div className='sticky top-0 z-50 flex items-center justify-between px-4 py-4 md:py-6 bg-slate-950/80 backdrop-blur-xl border-b border-white/5'>
          <button
            onClick={() => router.back()}
            className='p-2.5 -ml-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-95 group'
          >
            <ArrowLeft className='w-6 h-6 group-hover:-translate-x-1 transition-transform' />
          </button>

          <div className='flex items-center gap-2'>
            {!readOnly && (
              <>
                <button
                  onClick={onEdit}
                  className='max-md:hidden px-4 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-medium transition-colors border border-white/5'
                >
                  Edit
                </button>
                <div className='relative'>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className='p-2.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-95'
                  >
                    <MoreVertical className='w-6 h-6' />
                  </button>
                  {showMenu && (
                    <>
                      <div
                        className='fixed inset-0 z-10'
                        onClick={() => setShowMenu(false)}
                      />
                      <div className='absolute right-0 mt-2 w-48 bg-slate-900 rounded-xl shadow-2xl border border-white/10 overflow-hidden z-20 py-1 animate-in fade-in zoom-in-95 duration-200'>
                        <button
                          onClick={() => {
                            onEdit?.();
                            setShowMenu(false);
                          }}
                          className='w-full px-4 py-3 text-left text-sm text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2 md:hidden'
                        >
                          <Pencil className='w-4 h-4' />
                          Edit Activity
                        </button>
                        <button
                          onClick={() => {
                            onDelete?.();
                            setShowMenu(false);
                          }}
                          className='w-full px-4 py-3 text-left text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2'
                        >
                          <Trash2 className='w-4 h-4' />
                          Delete Activity
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Hero Section */}
        <div className='px-5 pt-8 pb-10'>
          <div className='flex flex-col gap-6'>
            {/* Status Badge */}
            <div className='flex items-center gap-3'>
              <button
                onClick={!readOnly ? onToggleDone : undefined}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border",
                  activity.done
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                    : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500",
                )}
              >
                {activity.done ? (
                  <>
                    <CheckCircle2 className='w-4 h-4' />
                    <span>Completed</span>
                  </>
                ) : (
                  <>
                    <Circle className='w-4 h-4' />
                    <span>Planned</span>
                  </>
                )}
              </button>

              <span className='text-slate-500 text-sm font-medium flex items-center gap-1.5'>
                <Calendar className='w-3.5 h-3.5' />
                {activityDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            {/* Title */}
            <h1
              className={cn(
                "text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight",
                activity.done &&
                  "text-slate-500 line-through decoration-slate-700 decoration-4",
              )}
            >
              {activity.title}
            </h1>

            {/* Time Badge */}
            {(activity.startTime || activity.endTime) && (
              <div className='inline-flex items-center gap-2 text-xl md:text-2xl font-medium text-orange-400'>
                <Clock className='w-6 h-6' />
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

        {/* Content Grid */}
        <div className='px-4 pb-20 space-y-6'>
          {/* Notes Section - if exists */}
          {activity.notes && (
            <div className='bg-slate-900/50 rounded-3xl p-6 md:p-8 border border-white/5'>
              <div className='flex items-center gap-3 mb-4 text-slate-400'>
                <FileText className='w-5 h-5' />
                <span className='text-sm font-bold uppercase tracking-widest'>
                  Notes
                </span>
              </div>
              <p className='text-lg text-slate-300 leading-relaxed whitespace-pre-wrap'>
                {activity.notes}
              </p>
            </div>
          )}

          {/* Transport Section */}
          {(activity.transportationMode ||
            activity.pickupTime ||
            activity.pickupLocation ||
            activity.dropoffLocation) && (
            <div className='bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-3xl p-6 md:p-8 border border-white/5 relative overflow-hidden'>
              <div className='absolute top-0 right-0 p-6 opacity-10'>
                <Navigation2 className='w-24 h-24 text-blue-400' />
              </div>

              <div className='relative z-10'>
                <div className='flex items-center gap-3 mb-6 text-blue-400'>
                  <Navigation2 className='w-5 h-5' />
                  <span className='text-sm font-bold uppercase tracking-widest'>
                    Transportation
                  </span>
                </div>

                <div className='grid gap-6'>
                  {activity.transportationMode && (
                    <div className='flex items-center gap-4'>
                      <div className='w-12 h-12 rounded-2xl bg-slate-800/50 flex items-center justify-center text-2xl border border-white/5'>
                        {activity.transportationMode === "car" && "🚗"}
                        {activity.transportationMode === "bus" && "🚌"}
                        {activity.transportationMode === "plane" && "✈️"}
                        {activity.transportationMode === "train" && "🚊"}
                        {activity.transportationMode === "taxi" && "🚕"}
                        {activity.transportationMode === "walking" && "🚶"}
                        {activity.transportationMode === "commute" && "🚌"}
                      </div>
                      <div>
                        <p className='text-sm text-slate-500 font-medium uppercase tracking-wide'>
                          Mode
                        </p>
                        <p className='text-xl font-bold text-white capitalize'>
                          {activity.transportationMode}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Locations */}
                  <div className='space-y-4'>
                    {(activity.pickupLocation || activity.pickupTime) && (
                      <div className='flex gap-4'>
                        <div className='flex flex-col items-center'>
                          <div className='w-3 h-3 rounded-full bg-slate-600 ring-4 ring-slate-900' />
                          {activity.dropoffLocation && (
                            <div className='w-0.5 h-full bg-slate-800 my-1' />
                          )}
                        </div>
                        <div className='pb-2'>
                          <p className='text-xs text-slate-500 font-bold uppercase mb-0.5'>
                            {activity.transportationMode === "plane"
                              ? "Departure"
                              : "Pickup"}
                          </p>
                          <p className='text-lg font-medium text-white'>
                            {activity.pickupLocation || "No location set"}
                          </p>
                          {activity.pickupTime && (
                            <p className='text-sm text-blue-400 font-medium mt-0.5'>
                              {formatTime12Hour(activity.pickupTime)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {activity.dropoffLocation && (
                      <div className='flex gap-4'>
                        <div className='flex flex-col items-center'>
                          <div className='w-3 h-3 rounded-full bg-orange-500 ring-4 ring-slate-900' />
                        </div>
                        <div>
                          <p className='text-xs text-slate-500 font-bold uppercase mb-0.5'>
                            {activity.transportationMode === "plane"
                              ? "Arrival"
                              : "Dropoff"}
                          </p>
                          <p className='text-lg font-medium text-white'>
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
            <div className='bg-slate-900/30 rounded-3xl p-6 md:p-8 border border-white/5'>
              <div className='flex items-center justify-between mb-6'>
                <div className='flex items-center gap-3 text-emerald-500'>
                  <DollarSign className='w-5 h-5' />
                  <span className='text-sm font-bold uppercase tracking-widest'>
                    Linked Expenses
                  </span>
                </div>
                <span className='bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20'>
                  {linkedExpenses.length}
                </span>
              </div>

              <div className='grid gap-3'>
                {linkedExpenses.map((expense) => (
                  <button
                    key={expense.id}
                    onClick={() => onSelectExpense?.(expense)}
                    className='flex items-center justify-between w-full bg-slate-800/50 hover:bg-slate-800 p-4 rounded-xl transition-all border border-white/5 hover:border-emerald-500/30 group text-left'
                  >
                    <div className='min-w-0 pr-4'>
                      <p className='font-bold text-white group-hover:text-emerald-400 transition-colors truncate'>
                        {expense.description}
                      </p>
                      <p className='text-sm text-slate-500'>
                        Paid by {expense.paidBy.split("@")[0]}
                      </p>
                    </div>
                    <div className='text-right whitespace-nowrap'>
                      <p className='font-bold text-emerald-400'>
                        ₱{expense.amount.toFixed(2)}
                      </p>
                      <div className='flex items-center justify-end gap-1 text-xs text-slate-600 mt-1 uppercase font-bold tracking-wider group-hover:text-emerald-500/70 transition-colors'>
                        <span>View</span>
                        <Link2 className='w-3 h-3' />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Action */}
          {!readOnly && onToggleDone && (
            <div className='pt-6'>
              <button
                onClick={onToggleDone}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold text-lg transition-all transform active:scale-[0.98] shadow-lg flex items-center justify-center gap-3",
                  activity.done
                    ? "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-white/5"
                    : "bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:brightness-110 shadow-orange-500/20",
                )}
              >
                {activity.done ? (
                  <>
                    <Circle className='w-5 h-5' />
                    <span>Mark as Incomplete</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className='w-5 h-5' />
                    <span>Complete Activity</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityDetail;
