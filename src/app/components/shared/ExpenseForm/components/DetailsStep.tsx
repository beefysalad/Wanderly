import { ChevronRight, Calendar, AlignLeft, User, Link as LinkIcon } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { Activity } from "@/src/shared/types";
import { formatActivityDisplay } from "../activityOptions";
import type { TExpenseSchema } from "../expenseSchema";

interface IDetailsStepProps {
  form: UseFormReturn<TExpenseSchema>;
  members: string[];
  getDisplayName: (email: string) => string;
  sortedActivities: Activity[];
  isPaidByGuest: boolean;
  setIsPaidByGuest: (value: boolean) => void;
}

export const DetailsStep = ({
  form,
  members,
  getDisplayName,
  sortedActivities,
  isPaidByGuest,
  setIsPaidByGuest,
}: IDetailsStepProps) => {
  return (
    <div className='space-y-5'>
      <div className='text-center mb-6 hidden sm:block'>
        <h3 className='text-lg font-bold text-white'>
          Expense Details
        </h3>
        <p className='text-sm text-slate-400'>
          Enter the amount and basic info.
        </p>
      </div>

      {/* Amount Input */}
      <div className='relative'>
        <label className='text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block'>
          Amount
        </label>
        <div className='relative group'>
          <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
            <span className='text-slate-400 font-semibold text-lg'>
              ₱
            </span>
          </div>
          <input
            type='number'
            step='0.01'
            {...form.register("amount")}
            placeholder='0.00'
            className='w-full pl-10 pr-4 py-4 bg-slate-800/50 border border-white/10 rounded-2xl text-3xl font-bold text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all'
            autoFocus
          />
        </div>
        {form.formState.errors.amount && (
          <p className='mt-2 text-sm text-red-400 flex items-center gap-1'>
            <span className='w-1 h-1 rounded-full bg-red-400 inline-block' />
            {form.formState.errors.amount.message}
          </p>
        )}
      </div>

      {/* Description Input */}
      <div>
        <label className='text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block'>
          Description
        </label>
        <div className='relative'>
          <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
            <AlignLeft className='w-5 h-5 text-slate-500' />
          </div>
          <input
            type='text'
            {...form.register("description")}
            placeholder='What is this for?'
            className='w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-medium'
          />
        </div>
        {form.formState.errors.description && (
          <p className='mt-2 text-sm text-red-400'>
            {form.formState.errors.description.message}
          </p>
        )}
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        {/* Date Input */}
        <div>
          <label className='text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block'>
            Date
          </label>
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
              <Calendar className='w-4 h-4 text-slate-500' />
            </div>
            <input
              type='date'
              {...form.register("date")}
              className='w-full pl-10 pr-3 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all'
              style={{ colorScheme: "dark" }}
            />
          </div>
        </div>

        {/* Category Selection */}
        <div>
          <label className='text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block'>
            Category
          </label>
          <div className='relative'>
            <select
              {...form.register("category")}
              className='w-full px-3 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all appearance-none'
            >
              <option value='accommodation'>
                🏨 Accommodation
              </option>
              <option value='food'>🍽️ Food & Dining</option>
              <option value='transport'>🚗 Transport</option>
              <option value='activities'>🎯 Activities</option>
              <option value='other'>📌 Other</option>
            </select>
            <div className='absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none'>
              <ChevronRight className='w-4 h-4 text-slate-500 rotate-90' />
            </div>
          </div>
        </div>
      </div>

      {/* Paid By */}
      <div>
        <div className='flex items-center justify-between mb-2'>
          <label className='text-xs font-semibold text-slate-400 uppercase tracking-wider block'>
            Paid By
          </label>
          <button
            type='button'
            onClick={() => {
              setIsPaidByGuest(!isPaidByGuest);
              form.setValue("paidBy", members[0] || "");
            }}
            className='text-xs text-orange-400 hover:text-orange-300 transition-colors'
          >
            {isPaidByGuest ? "Select Member" : "Enter Guest Name"}
          </button>
        </div>
        <div className='relative'>
          <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
            <User className='w-4 h-4 text-slate-500' />
          </div>
          {isPaidByGuest ? (
            <input
              type='text'
              {...form.register("paidBy")}
              placeholder='Enter guest name'
              className='w-full pl-10 pr-3 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-medium'
            />
          ) : (
            <>
              <select
                {...form.register("paidBy")}
                className='w-full pl-10 pr-3 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all appearance-none'
              >
                {members.map((member) => (
                  <option key={member} value={member}>
                    {getDisplayName(member)}
                  </option>
                ))}
              </select>
              <div className='absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none'>
                <ChevronRight className='w-4 h-4 text-slate-500 rotate-90' />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Activity Link */}
      {sortedActivities.length > 0 && (
        <div>
          <label className='text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block flex items-center gap-2'>
            <span>Link to Activity</span>
            <span className='text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-500'>
              Optional
            </span>
          </label>
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
              <LinkIcon className='w-4 h-4 text-slate-500' />
            </div>
            <select
              {...form.register("activityId")}
              className='w-full pl-10 pr-3 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all appearance-none'
            >
              <option value=''>No activity linked</option>
              {sortedActivities.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {formatActivityDisplay(activity)}
                </option>
              ))}
            </select>
            <div className='absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none'>
              <ChevronRight className='w-4 h-4 text-slate-500 rotate-90' />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
