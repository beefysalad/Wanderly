"use client";
import React, { useState } from "react";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { createTripSchema, TCreateTripSchema } from "./createTripZod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useCreateTrip } from "@/src/hooks/useTrips";
import { useRouter } from "next/navigation";

interface ICreateTripModal {
  groupId: string;
  onClose: () => void;
}
const CreateTripModal = ({ groupId, onClose }: ICreateTripModal) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const createTrip = useCreateTrip(groupId);

  const form = useForm<TCreateTripSchema>({
    resolver: zodResolver(createTripSchema),
    defaultValues: {
      endDate: "",
      location: "",
      startDate: "",
      tripName: "",
      status: "planning",
    },
  });

  const onSubmit = async (values: TCreateTripSchema) => {
    try {
      setError(null);
      const result = await createTrip.mutateAsync({
        tripName: values.tripName,
        startDate: values.startDate,
        endDate: values.endDate,
        location: values.location,
        status: values.status,
      });

      // Show navigating state
      setIsNavigating(true);

      // Wait a moment for cache to update and show feedback
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Navigate to the new trip
      if (result.trip) {
        router.push(`/group/${groupId}/trip/${result.trip.id}`);
        // Close modal after navigation
        onClose();
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const message =
        err?.response?.data?.error || err?.message || "Failed to create trip";
      setError(message);
      setIsNavigating(false);
    }
  };

  const isLoading = createTrip.isPending || isNavigating;
  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50'>
      <div className='bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-sm w-full p-6 relative'>
        {/* Loading Overlay */}
        {isLoading && (
          <div className='absolute inset-0 bg-white/90 dark:bg-slate-800/90 rounded-lg flex items-center justify-center z-10'>
            <div className='text-center'>
              <div className='w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3'></div>
              <p className='text-slate-700 dark:text-slate-300 font-medium'>
                {createTrip.isPending ? "Creating trip..." : "Redirecting..."}
              </p>
            </div>
          </div>
        )}

        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-xl font-bold text-slate-900 dark:text-white'>
            Create Trip
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className='text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
          <div>
            <Label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
              Trip Name
            </Label>
            <Input
              type='text'
              {...form.register("tripName")}
              placeholder='e.g., Paris Adventure'
              className='w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>

          <div>
            <Label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
              Location{" "}
              <span className='text-slate-500 text-xs'>(optional)</span>
            </Label>
            <Input
              type='text'
              {...form.register("location")}
              placeholder='e.g., Paris, France'
              className='w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
              Status
            </label>
            <select
              {...form.register("status")}
              className='w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='planning'>Planning</option>
              <option value='finalized'>Finalized</option>
              <option value='ongoing'>Ongoing</option>
              <option value='cancelled'>Cancelled</option>
            </select>
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <div>
              <Label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                Start Date
              </Label>
              <Input
                type='date'
                {...form.register("startDate")}
                className='w-full min-w-0 h-10 px-2 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 [-webkit-appearance:none] [appearance:none]'
                style={{ WebkitAppearance: "none", appearance: "none" }}
              />
            </div>
            <div>
              <Label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                End Date
              </Label>
              <Input
                type='date'
                {...form.register("endDate")}
                className='w-full min-w-0 h-10 px-2 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 [-webkit-appearance:none] [appearance:none]'
                style={{ WebkitAppearance: "none", appearance: "none" }}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className='p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm'>
              {error}
            </div>
          )}

          {/* Form Errors */}
          {form.formState.errors.tripName && (
            <div className='p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm'>
              {form.formState.errors.tripName.message}
            </div>
          )}
          {form.formState.errors.startDate && (
            <div className='p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm'>
              {form.formState.errors.startDate.message}
            </div>
          )}
          {form.formState.errors.endDate && (
            <div className='p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm'>
              {form.formState.errors.endDate.message}
            </div>
          )}

          <div className='flex gap-3 pt-4'>
            <button
              type='button'
              onClick={onClose}
              disabled={isLoading}
              className='flex-1 px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={isLoading}
              className='flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isLoading
                ? createTrip.isPending
                  ? "Creating..."
                  : "Redirecting..."
                : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTripModal;
