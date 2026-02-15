"use client";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  activitySchema,
  TActivitySchema,
} from "@/src/app/components/shared/Modal/ActivityModal/activityAddZod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Clock,
  Calendar,
  Plane,
  Car,
  MapPin,
  Utensils,
  Hotel,
  Ticket,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateActivity } from "@/src/hooks/useActivities";
import { useRouter, useSearchParams } from "next/navigation";
import { useGroup } from "@/src/hooks/useGroups";
import { Trip } from "@/src/shared/types";
import NavigationLoader from "@/src/app/components/shared/NavigationLoader";
import DashboardLayoutHeader from "@/src/app/components/shared/DashboardLayoutHeader";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const transportationModes = [
  "commute",
  "car",
  "plane",
  "bus",
  "train",
  "taxi",
  "walking",
  "other",
] as const;

type ActivityType =
  | "general"
  | "flight"
  | "transport"
  | "accommodation"
  | "food";

interface AddActivityPageProps {
  params: Promise<{
    groupId: string;
    tripId: string;
  }>;
}

const AddActivityPage = ({ params }: AddActivityPageProps) => {
  const { groupId, tripId } = React.use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedDateStr = searchParams.get("date");

  // Parse date string safely
  let preSelectedDate: Date | null = null;
  if (preSelectedDateStr) {
    const parsed = new Date(preSelectedDateStr);
    if (!isNaN(parsed.getTime())) {
      preSelectedDate = parsed;
    }
  }

  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedType, setSelectedType] = useState<ActivityType | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // Fetch trip data to get dates
  const { data: groupData, isLoading: isLoadingGroup } = useGroup(groupId);
  const trip =
    groupData?.group?.trips?.find((t: Trip) => t.id === tripId) || null;

  const createActivity = useCreateActivity(tripId, groupId);

  const form = useForm<TActivitySchema>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      title: "",
      date: preSelectedDate
        ? preSelectedDate.toISOString().split("T")[0]
        : trip?.startDate
          ? new Date(trip.startDate).toISOString().split("T")[0]
          : "",
      startTime: "",
      endTime: "",
      notes: "",
      transportationMode: undefined,
      pickupTime: undefined,
      pickupLocation: undefined,
      dropoffLocation: undefined,
    },
  });

  // Update default date when trip loads if not set
  useEffect(() => {
    if (trip && !form.getValues("date") && !preSelectedDate) {
      form.setValue(
        "date",
        new Date(trip.startDate).toISOString().split("T")[0],
      );
    }
  }, [trip, form, preSelectedDate]);

  // Handle Type Selection
  const handleTypeSelect = (type: ActivityType) => {
    setSelectedType(type);

    // Auto-fill logic based on type
    if (type === "flight") {
      form.setValue("transportationMode", "plane");
    } else if (type === "transport") {
      // Default to car or leave empty for user to pick
      if (!form.getValues("transportationMode")) {
        form.setValue("transportationMode", "car");
      }
    } else {
      // Clear transport mode if switching back to general/food/accommodation
      // unless user explicitly wants it? Let's clear it for simplicity
      form.setValue("transportationMode", undefined);
    }

    setCurrentStep(2);
  };

  const onSubmit = async (values: TActivitySchema) => {
    console.log("Submitting activity form:", values);
    try {
      setError(null);
      await createActivity.mutateAsync({
        title: values.title,
        date: values.date,
        startTime: values.startTime || undefined,
        endTime: values.endTime || undefined,
        notes: values.notes || undefined,
        transportationMode: values.transportationMode
          ? (values.transportationMode as (typeof transportationModes)[number])
          : undefined,
        pickupTime: values.pickupTime || undefined,
        pickupLocation: values.pickupLocation || undefined,
        dropoffLocation: values.dropoffLocation || undefined,
      });

      setIsNavigating(true);
      // Wait a moment for cache to update and show feedback
      await new Promise((resolve) => setTimeout(resolve, 300));
      router.push(`/group/${groupId}/trip/${tripId}`);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { error?: string } } })?.response
              ?.data?.error || "Failed to save activity";
      setError(message);
      setIsNavigating(false);
    }
  };

  const isLoading = createActivity.isPending || isNavigating || isLoadingGroup;

  // Calculate available dates
  const availableDates: Date[] = [];
  if (trip) {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const current = new Date(start);
    while (current <= end) {
      availableDates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
  }

  if (isLoadingGroup) {
    return (
      <main className='min-h-screen bg-slate-950 flex items-center justify-center p-4'>
        <div className='flex flex-col items-center gap-4'>
          <div className='w-12 h-12 border-4 border-slate-700 border-t-orange-500 rounded-full animate-spin'></div>
          <p className='text-slate-400'>Loading trip details...</p>
        </div>
      </main>
    );
  }

  if (!trip) {
    return (
      <main className='min-h-screen bg-slate-950 flex items-center justify-center p-4'>
        <div className='text-center'>
          <h2 className='text-xl font-bold text-white mb-2'>Trip Not Found</h2>
          <button
            onClick={() => router.back()}
            className='text-orange-500 hover:text-orange-600 font-medium'
          >
            Go Back
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className='min-h-screen bg-slate-950 flex flex-col relative overflow-hidden font-sans selection:bg-orange-500/30'>
      {/* Background Effects */}
      <div className='absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none'>
        <div className='absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px]'></div>
        <div className='absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500/10 rounded-full blur-[120px]'></div>
      </div>

      {isNavigating && <NavigationLoader message='Adding activity...' />}

      <div className='max-w-4xl mx-auto w-full px-4 relative z-20'>
        <DashboardLayoutHeader showBack={true} title='Add Activity' />
      </div>

      <div className='flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 pb-24 relative z-10 pt-4'>
        <div className='max-w-2xl mx-auto w-full'>
          <AnimatePresence mode='wait'>
            {/* Step 1: Type Selection */}
            {currentStep === 1 && (
              <motion.div
                key='step1'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className='space-y-6'
              >
                <div className='text-center mb-8'>
                  <h2 className='text-2xl font-bold text-white mb-2'>
                    What kind of activity?
                  </h2>
                  <p className='text-slate-400'>
                    Choose a category to get started.
                  </p>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <button
                    onClick={() => handleTypeSelect("general")}
                    className='bg-slate-900/40 backdrop-blur-md border border-white/5 hover:border-orange-500/50 hover:bg-slate-800/60 p-6 rounded-2xl flex flex-col items-center gap-4 transition-all group'
                  >
                    <div className='w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-orange-400 group-hover:bg-orange-500/10 transition-colors'>
                      <Ticket className='w-7 h-7' />
                    </div>
                    <span className='font-semibold text-white'>General</span>
                  </button>

                  <button
                    onClick={() => handleTypeSelect("flight")}
                    className='bg-slate-900/40 backdrop-blur-md border border-white/5 hover:border-blue-500/50 hover:bg-slate-800/60 p-6 rounded-2xl flex flex-col items-center gap-4 transition-all group'
                  >
                    <div className='w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-colors'>
                      <Plane className='w-7 h-7' />
                    </div>
                    <span className='font-semibold text-white'>Flight</span>
                  </button>

                  <button
                    onClick={() => handleTypeSelect("transport")}
                    className='bg-slate-900/40 backdrop-blur-md border border-white/5 hover:border-purple-500/50 hover:bg-slate-800/60 p-6 rounded-2xl flex flex-col items-center gap-4 transition-all group'
                  >
                    <div className='w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-purple-400 group-hover:bg-purple-500/10 transition-colors'>
                      <Car className='w-7 h-7' />
                    </div>
                    <span className='font-semibold text-white'>Transport</span>
                  </button>

                  <button
                    onClick={() => handleTypeSelect("accommodation")}
                    className='bg-slate-900/40 backdrop-blur-md border border-white/5 hover:border-emerald-500/50 hover:bg-slate-800/60 p-6 rounded-2xl flex flex-col items-center gap-4 transition-all group'
                  >
                    <div className='w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-colors'>
                      <Hotel className='w-7 h-7' />
                    </div>
                    <span className='font-semibold text-white'>
                      Hotel / Stay
                    </span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Details Form */}
            {currentStep === 2 && (
              <motion.div
                key='step2'
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className='flex-1 flex flex-col'
              >
                <div className='bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl'>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className='space-y-6'
                  >
                    {/* Form Header */}
                    <div className='flex items-center gap-3 mb-6'>
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg",
                          selectedType === "flight"
                            ? "bg-blue-500"
                            : selectedType === "transport"
                              ? "bg-purple-500"
                              : selectedType === "accommodation"
                                ? "bg-emerald-500"
                                : "bg-orange-500",
                        )}
                      >
                        {selectedType === "flight" && (
                          <Plane className='w-5 h-5' />
                        )}
                        {selectedType === "transport" && (
                          <Car className='w-5 h-5' />
                        )}
                        {selectedType === "accommodation" && (
                          <Hotel className='w-5 h-5' />
                        )}
                        {selectedType === "general" && (
                          <Ticket className='w-5 h-5' />
                        )}
                        {selectedType === "food" && (
                          <Utensils className='w-5 h-5' />
                        )}
                      </div>
                      <div>
                        <h3 className='text-lg font-bold text-white leading-tight'>
                          {selectedType === "flight"
                            ? "Add Flight Details"
                            : selectedType === "transport"
                              ? "Add Transport Details"
                              : selectedType === "accommodation"
                                ? "Add Stay Details"
                                : "New Activity"}
                        </h3>
                        <p className='text-xs text-slate-400'>
                          Fill in the missing details
                        </p>
                      </div>
                    </div>

                    {/* Basic Info */}
                    <div className='space-y-4'>
                      <div>
                        <label className='block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 ml-1'>
                          {selectedType === "flight"
                            ? "Flight Number / Airline"
                            : selectedType === "accommodation"
                              ? "Hotel Name"
                              : "Activity Title"}
                        </label>
                        <input
                          type='text'
                          {...form.register("title")}
                          placeholder={
                            selectedType === "flight"
                              ? "e.g. PR 2808 or PAL Flight"
                              : selectedType === "transport"
                                ? "e.g. Bus to Baguio"
                                : "e.g. Visit Louvre Museum"
                          }
                          className='w-full px-4 py-3 border border-white/10 rounded-xl bg-slate-800/50 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-medium'
                          autoFocus
                        />
                        {form.formState.errors.title && (
                          <p className='mt-1 text-xs text-red-400 ml-1'>
                            {form.formState.errors.title.message}
                          </p>
                        )}
                      </div>

                      <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <label className='block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 ml-1'>
                            Date
                          </label>
                          <div className='relative'>
                            <select
                              {...form.register("date")}
                              className='w-full px-4 py-3 border border-white/10 rounded-xl bg-slate-800/50 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all appearance-none font-medium'
                            >
                              {availableDates.map((d) => (
                                <option
                                  key={d.toISOString()}
                                  value={d.toISOString().split("T")[0]}
                                  className='bg-slate-800 text-white'
                                >
                                  {d.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </option>
                              ))}
                            </select>
                            <div className='absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500'>
                              <Calendar className='w-4 h-4' />
                            </div>
                          </div>
                        </div>

                        {/* Transport Mode (Only for Transport type) */}
                        {selectedType === "transport" && (
                          <div>
                            <label className='block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 ml-1'>
                              Mode
                            </label>
                            <Select
                              value={form.watch("transportationMode") || ""}
                              onValueChange={(value) => {
                                const modeValue =
                                  value === ""
                                    ? undefined
                                    : (value as (typeof transportationModes)[number]);
                                form.setValue("transportationMode", modeValue);
                              }}
                            >
                              <SelectTrigger className='w-full h-[46px] bg-slate-800/50 border-white/10 rounded-xl text-white'>
                                <SelectValue placeholder='Select...' />
                              </SelectTrigger>
                              <SelectContent className='bg-slate-900 border-slate-800 text-white'>
                                <SelectItem value='car'>🚗 Car</SelectItem>
                                <SelectItem value='bus'>🚌 Bus</SelectItem>
                                <SelectItem value='train'>🚊 Train</SelectItem>
                                <SelectItem value='taxi'>🚕 Taxi</SelectItem>
                                <SelectItem value='walking'>
                                  🚶 Walking
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>

                      {/* Time */}
                      <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <label className='block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 ml-1'>
                            {selectedType === "flight"
                              ? "Departure Time"
                              : "Start Time"}
                          </label>
                          <div className='relative'>
                            <input
                              type='time'
                              {...form.register("startTime")}
                              className='w-full px-4 py-3 border border-white/10 rounded-xl bg-slate-800/50 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-medium appearance-none' // appearance-none needed for mobile
                            />
                            <div className='absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500'>
                              <Clock className='w-4 h-4' />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className='block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 ml-1'>
                            {selectedType === "flight"
                              ? "Arrival Time"
                              : "End Time"}
                          </label>
                          <div className='relative'>
                            <input
                              type='time'
                              {...form.register("endTime")}
                              className='w-full px-4 py-3 border border-white/10 rounded-xl bg-slate-800/50 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-medium appearance-none'
                            />
                            <div className='absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500'>
                              <Clock className='w-4 h-4' />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Flight/Transport Specific Fields */}
                    {(selectedType === "flight" ||
                      selectedType === "transport") && (
                      <div className='space-y-4 pt-4 border-t border-white/5'>
                        <div className='grid grid-cols-2 gap-4'>
                          <div>
                            <label className='block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 ml-1'>
                              {selectedType === "flight"
                                ? "Dep Airport"
                                : "Pickup / From"}
                            </label>
                            <div className='relative'>
                              <input
                                type='text'
                                {...form.register("pickupLocation")}
                                placeholder={
                                  selectedType === "flight"
                                    ? "MNL"
                                    : "Station/Location"
                                }
                                className='w-full px-4 py-3 border border-white/10 rounded-xl bg-slate-800/50 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium'
                              />
                              <div className='absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500'>
                                <MapPin className='w-4 h-4' />
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className='block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 ml-1'>
                              {selectedType === "flight"
                                ? "Arr Airport"
                                : "Dropoff / To"}
                            </label>
                            <div className='relative'>
                              <input
                                type='text'
                                {...form.register("dropoffLocation")}
                                placeholder={
                                  selectedType === "flight"
                                    ? "NRT"
                                    : "Station/Location"
                                }
                                className='w-full px-4 py-3 border border-white/10 rounded-xl bg-slate-800/50 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-medium'
                              />
                              <div className='absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500'>
                                <MapPin className='w-4 h-4' />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <label className='block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 ml-1'>
                        Notes
                      </label>
                      <textarea
                        {...form.register("notes")}
                        placeholder='Add reservation numbers, gate info, or packing notes...'
                        rows={4}
                        className='w-full px-4 py-3 border border-white/10 rounded-xl bg-slate-800/50 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all resize-none font-medium'
                      />
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div className='p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium'>
                        {error}
                      </div>
                    )}

                    {/* Actions */}
                    <div className='flex gap-3 pt-2'>
                      <button
                        type='button'
                        onClick={() => setCurrentStep(1)}
                        className='px-5 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 font-medium transition-all'
                      >
                        Back
                      </button>
                      <button
                        type='submit'
                        disabled={isLoading}
                        className='flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed'
                      >
                        {isLoading ? "Saving..." : "Create Activity"}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
};

export default AddActivityPage;
