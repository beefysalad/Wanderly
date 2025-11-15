import { Activity } from "@/src/shared/types";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { activitySchema, TActivitySchema } from "./activityAddZod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Clock, FileText, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  useCreateActivity,
  useUpdateActivity,
} from "@/src/hooks/useActivities";

interface IActivityModal {
  tripId: string;
  groupId: string;
  startDate: Date;
  endDate: Date;
  onClose: () => void;
  preSelectedDate?: Date | null;
  isDateLocked?: boolean;
  editingActivity?: Activity | null;
}
const ActivityModal = ({
  tripId,
  groupId,
  endDate,
  onClose,
  startDate,
  editingActivity,
  isDateLocked,
  preSelectedDate,
}: IActivityModal) => {
  const [error, setError] = useState<string | null>(null);
  const createActivity = useCreateActivity(tripId, groupId);
  const updateActivity = useUpdateActivity(
    tripId,
    editingActivity?.id || "",
    groupId
  );

  const form = useForm<TActivitySchema>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      title: editingActivity?.title || "",
      date:
        editingActivity?.date ||
        (preSelectedDate
          ? preSelectedDate.toISOString().split("T")[0]
          : startDate.toISOString().split("T")[0]),
      startTime: editingActivity?.startTime || "",
      endTime: editingActivity?.endTime || "",
      notes: editingActivity?.notes || "",
    },
  });

  const onSubmit = async (values: TActivitySchema) => {
    try {
      setError(null);
      if (editingActivity) {
        // Update existing activity
        await updateActivity.mutateAsync({
          title: values.title,
          date: values.date,
          startTime: values.startTime || undefined,
          endTime: values.endTime || undefined,
          notes: values.notes || undefined,
        });
      } else {
        // Create new activity
        await createActivity.mutateAsync({
          title: values.title,
          date: values.date,
          startTime: values.startTime || undefined,
          endTime: values.endTime || undefined,
          notes: values.notes || undefined,
        });
      }
      onClose();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { error?: string } } })?.response
              ?.data?.error || "Failed to save activity";
      setError(message);
    }
  };

  const isLoading = createActivity.isPending || updateActivity.isPending;

  const availableDates = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    availableDates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50'>
      <div className='bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-center justify-between mb-6'>
          <h2 className='text-xl font-bold text-slate-900 dark:text-white'>
            {editingActivity ? "Edit Event" : "Add Event"}
          </h2>
          <button
            onClick={onClose}
            className='p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors'
          >
            <X className='w-5 h-5 text-slate-500' />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
          {/* Title */}
          <div>
            <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
              What&apos;s happening?
            </label>
            <input
              type='text'
              {...form.register("title")}
              placeholder='e.g., Lunch at Torre Eiffel'
              className='w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
              autoFocus
            />
          </div>

          {/* Date */}
          <div>
            <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2'>
              <Calendar className='w-4 h-4' />
              Date
            </label>
            <select
              {...form.register("date")}
              disabled={isDateLocked}
              className='w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {availableDates.map((d) => (
                <option
                  key={d.toISOString()}
                  value={d.toISOString().split("T")[0]}
                >
                  {d.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </option>
              ))}
            </select>
          </div>

          {/* Time Range */}
          <div>
            <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2'>
              <Clock className='w-4 h-4' />
              Time Range{" "}
              <span className='text-xs text-slate-500 dark:text-slate-400'>
                (optional)
              </span>
            </label>
            <div className='flex gap-2'>
              <div className='flex-1'>
                <Input
                  type='time'
                  {...form.register("startTime")}
                  placeholder='Start'
                  className='w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                  style={{ WebkitAppearance: "none", appearance: "none" }}
                />
              </div>
              <div className='flex items-center text-slate-500'>—</div>
              <div className='flex-1'>
                <Input
                  type='time'
                  {...form.register("endTime")}
                  placeholder='End'
                  className='w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                  style={{ WebkitAppearance: "none", appearance: "none" }}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2'>
              <FileText className='w-4 h-4' />
              Notes{" "}
              <span className='text-xs text-slate-500 dark:text-slate-400'>
                (optional)
              </span>
            </label>
            <textarea
              {...form.register("notes")}
              placeholder='Any details about this event...'
              rows={3}
              className='w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className='p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm'>
              {error}
            </div>
          )}

          {/* Form Validation Errors */}
          {form.formState.errors.title && (
            <div className='p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm'>
              {form.formState.errors.title.message}
            </div>
          )}
          {form.formState.errors.startTime && (
            <div className='p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm'>
              {form.formState.errors.startTime.message}
            </div>
          )}

          {/* Buttons */}
          <div className='flex gap-3 pt-4'>
            <button
              type='button'
              onClick={onClose}
              disabled={isLoading}
              className='flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={isLoading}
              className='flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isLoading
                ? editingActivity
                  ? "Updating..."
                  : "Adding..."
                : editingActivity
                ? "Update Event"
                : "Add Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActivityModal;
