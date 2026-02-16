"use client";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Budget, Activity } from "@/src/shared/types";
import { budgetSchema, TBudgetSchema } from "./budgetSchema";
import {
  Target,
  AlignLeft,
  Calendar,
  Tag,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { useCreateBudget, useUpdateBudget } from "@/src/hooks/useBudgets";
import { formatTime12Hour } from "@/lib/utils";

interface BudgetFormProps {
  tripId: string;
  groupId: string;
  activities: Activity[];
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Budget;
}

const BudgetForm = ({
  tripId,
  groupId,
  activities,
  onSuccess,
  onCancel,
  initialData,
}: BudgetFormProps) => {
  const createBudgetMutation = useCreateBudget(tripId, groupId);
  const updateBudgetMutation = useUpdateBudget(
    tripId,
    initialData?.id || "",
    groupId,
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TBudgetSchema>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      amount: "",
      description: "",
      category: "other",
      activityId: "",
      isBooked: false,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        amount: initialData.amount.toString(),
        description: initialData.description || "",
        category: initialData.category || "other",
        activityId: initialData.activityId || "",
        isBooked: initialData.isBooked,
      });
    }
  }, [initialData, reset]);

  const onSubmit = async (data: TBudgetSchema) => {
    try {
      if (initialData) {
        await updateBudgetMutation.mutateAsync({
          ...data,
          amount: Number(data.amount),
        });
      } else {
        await createBudgetMutation.mutateAsync({
          ...data,
          amount: Number(data.amount),
        });
      }
      onSuccess();
    } catch (error) {
      console.error("Failed to save budget:", error);
    }
  };

  const isBooked = watch("isBooked");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
      {/* Amount */}
      <div>
        <label className='text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block'>
          Planned Amount
        </label>
        <div className='relative group'>
          <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
            <span className='text-slate-400 font-semibold text-lg'>₱</span>
          </div>
          <input
            type='number'
            step='0.01'
            {...register("amount")}
            placeholder='0.00'
            className='w-full pl-10 pr-4 py-4 bg-slate-800/50 border border-white/10 rounded-2xl text-3xl font-bold text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all'
            autoFocus
          />
        </div>
        {errors.amount && (
          <p className='mt-2 text-sm text-red-400'>{errors.amount.message}</p>
        )}
      </div>

      {/* Description */}
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
            {...register("description")}
            placeholder='Ex: Food for Day 1, Flight tickets...'
            className='w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-medium'
          />
        </div>
        {errors.description && (
          <p className='mt-2 text-sm text-red-400'>
            {errors.description.message}
          </p>
        )}
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        {/* Category */}
        <div>
          <label className='text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block'>
            Category
          </label>
          <div className='relative'>
            <select
              {...register("category")}
              className='w-full px-3 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all appearance-none'
            >
              <option value='accommodation'>🏨 Accommodation</option>
              <option value='food'>🍽️ Food & Dining</option>
              <option value='transport'>🚗 Transport</option>
              <option value='activities'>🎯 Activities</option>
              <option value='other'>📌 Other</option>
            </select>
          </div>
        </div>

        {/* Booking Status */}
        <div>
          <label className='text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block'>
            Status
          </label>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={() => setValue("isBooked", false)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                !isBooked
                  ? "bg-orange-500/20 border-orange-500 text-orange-400"
                  : "bg-slate-800 border-white/5 text-slate-500 hover:text-slate-300"
              }`}
            >
              <Circle className='w-3 h-3' />
              Estimate
            </button>
            <button
              type='button'
              onClick={() => setValue("isBooked", true)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                isBooked
                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                  : "bg-slate-800 border-white/5 text-slate-500 hover:text-slate-300"
              }`}
            >
              <CheckCircle2 className='w-3 h-3' />
              Booked
            </button>
          </div>
        </div>
      </div>

      {/* Activity Link */}
      {activities.length > 0 && (
        <div>
          <label className='text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block'>
            Link to Activity (Optional)
          </label>
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
              <Target className='w-4 h-4 text-slate-500' />
            </div>
            <select
              {...register("activityId")}
              className='w-full pl-10 pr-3 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all appearance-none'
            >
              <option value=''>No activity linked</option>
              {activities.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {activity.title} (
                  {new Date(activity.date).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className='pt-4 pb-2'>
        <button
          type='submit'
          disabled={isSubmitting}
          className='w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl font-bold shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50'
        >
          {isSubmitting ? (
            <span className='w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin' />
          ) : initialData ? (
            "Update Budget"
          ) : (
            "Save Budget Estimate"
          )}
        </button>
      </div>
    </form>
  );
};

export default BudgetForm;
