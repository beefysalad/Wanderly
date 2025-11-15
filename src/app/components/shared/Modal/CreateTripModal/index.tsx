"use client";
import React from "react";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { createTripSchema, TCreateTripSchema } from "./createTripZod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ICreateTripModal {
  onClose: () => void;
}
const CreateTripModal = ({ onClose }: ICreateTripModal) => {
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
  const onSubmit = (values: TCreateTripSchema) => console.log(values);
  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50'>
      <div className='bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-sm w-full p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-xl font-bold text-slate-900 dark:text-white'>
            Create Trip
          </h2>
          <button
            onClick={onClose}
            className='text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
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

          {/* {error && (
            <p className='text-red-600 dark:text-red-400 text-sm'>{error}</p>
          )} */}

          <div className='flex gap-3 pt-4'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg font-medium transition-colors'
            >
              Cancel
            </button>
            <button
              type='submit'
              className='flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors'
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTripModal;
