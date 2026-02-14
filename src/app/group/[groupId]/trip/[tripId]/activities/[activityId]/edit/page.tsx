"use client";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  activitySchema,
  TActivitySchema,
} from "@/src/app/components/shared/Modal/ActivityModal/activityAddZod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  Navigation,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateActivity } from "@/src/hooks/useActivities"; // Need to ensure this hook exists or create it
import { useRouter } from "next/navigation";
import { useGroup } from "@/src/hooks/useGroups";
import { Trip, Activity } from "@/src/shared/types";
import NavigationLoader from "@/src/app/components/shared/NavigationLoader";
import api from "@/lib/axios";

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

type Step = 1 | 2 | 3;

interface EditActivityPageProps {
  params: {
    groupId: string;
    tripId: string;
    activityId: string;
  };
}

const EditActivityPage = ({ params }: EditActivityPageProps) => {
  const { groupId, tripId, activityId } = params;
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isNavigating, setIsNavigating] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Fetch trip data
  const { data: groupData, isLoading: isLoadingGroup } = useGroup(groupId);
  const trip =
    groupData?.group?.trips?.find((t: Trip) => t.id === tripId) || null;

  // We need to fetch the specific activity or find it in the trip
  const activity = trip?.activities?.find((a: Activity) => a.id === activityId);

  const updateActivity = useUpdateActivity(tripId, groupId);

  const form = useForm<TActivitySchema>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      title: "",
      date: "",
      startTime: "",
      endTime: "",
      notes: "",
      transportationMode: undefined,
      pickupTime: undefined,
      pickupLocation: undefined,
      dropoffLocation: undefined,
    },
  });

  // Load initial data
  useEffect(() => {
    if (activity) {
      form.reset({
        title: activity.title,
        date: new Date(activity.date).toISOString().split("T")[0],
        startTime: activity.startTime || "",
        endTime: activity.endTime || "",
        notes: activity.notes || "",
        transportationMode:
          activity.transportationMode as TActivitySchema["transportationMode"],
        pickupTime: activity.pickupTime || undefined,
        pickupLocation: activity.pickupLocation || undefined,
        dropoffLocation: activity.dropoffLocation || undefined,
      });
      setInitialLoading(false);
    } else if (!isLoadingGroup && trip && !activity) {
      // Activity not found in trip data
      setInitialLoading(false);
      setError("Activity not found");
    }
  }, [activity, trip, isLoadingGroup, form]);

  const onSubmit = async (values: TActivitySchema) => {
    try {
      setError(null);
      await updateActivity.mutateAsync({
        activityId,
        updates: {
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
        },
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
              ?.data?.error || "Failed to update activity";
      setError(message);
      setIsNavigating(false);
    }
  };

  const isLoading =
    updateActivity.isPending ||
    isNavigating ||
    isLoadingGroup ||
    initialLoading;

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

  // Step validation
  const validateStep = async (step: Step): Promise<boolean> => {
    if (step === 1) {
      return await form.trigger(["title", "date"]);
    } else if (step === 2) {
      return true;
    } else if (step === 3) {
      return true;
    }
    return false;
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleSkipTransportation = async () => {
    // Clear transportation fields and submit
    form.setValue("transportationMode", undefined);
    form.setValue("pickupTime", undefined);
    form.setValue("pickupLocation", undefined);
    form.setValue("dropoffLocation", undefined);
    await form.handleSubmit(onSubmit)();
  };

  const steps = [
    {
      number: 1,
      title: "Basic Info",
      icon: Calendar,
      description: "Title and date",
    },
    {
      number: 2,
      title: "Time & Details",
      icon: Clock,
      description: "Schedule and notes",
    },
    {
      number: 3,
      title: "Transportation",
      icon: Navigation,
      description: "Optional travel details",
    },
  ];

  if (isLoadingGroup || initialLoading) {
    return (
      <main className='min-h-screen bg-slate-950 flex items-center justify-center p-4'>
        <div className='flex flex-col items-center gap-4'>
          <Loader2 className='w-12 h-12 text-orange-500 animate-spin' />
          <p className='text-slate-400'>Loading activity details...</p>
        </div>
      </main>
    );
  }

  if (!trip || !activity) {
    return (
      <main className='min-h-screen bg-slate-950 flex items-center justify-center p-4'>
        <div className='text-center'>
          <h2 className='text-xl font-bold text-white mb-2'>
            Activity Not Found
          </h2>
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
    <main className='min-h-screen bg-slate-950 flex flex-col relative overflow-hidden'>
      {/* Background Effects */}
      <div className='absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none'>
        <div className='absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-3xl'></div>
        <div className='absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-3xl'></div>
      </div>
      {isNavigating && <NavigationLoader message='Updating activity...' />}

      {/* Top Bar */}
      <div className='p-4 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl flex items-center gap-4 sticky top-0 z-20'>
        <button
          onClick={() => router.back()}
          className='p-2 hover:bg-slate-800 rounded-full transition-colors'
        >
          <ArrowLeft className='w-5 h-5 text-slate-400' />
        </button>
        <div>
          <h1 className='text-lg font-bold text-white'>Edit Activity</h1>
          <p className='text-xs text-slate-400'>{trip.name}</p>
        </div>
      </div>

      <div className='flex-1 flex flex-col max-w-3xl mx-auto w-full p-4 pb-24'>
        {/* Stepper */}
        <div className='mb-8'>
          <div className='flex items-center justify-center relative px-4'>
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              const isLast = index === steps.length - 1;

              return (
                <React.Fragment key={step.number}>
                  <div className='flex items-center justify-center flex-1 relative'>
                    {/* Step Circle */}
                    <div className='flex flex-col items-center gap-2 flex-shrink-0 z-10'>
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                          isCompleted
                            ? "bg-orange-500 border-orange-500 text-white"
                            : isActive
                              ? "bg-orange-900/30 border-orange-500 text-orange-400"
                              : "bg-slate-800 border-slate-600 text-slate-400"
                        }`}
                      >
                        {isCompleted ? (
                          <Check className='w-5 h-5' />
                        ) : (
                          <StepIcon className='w-5 h-5' />
                        )}
                      </div>
                      <div className='text-center hidden sm:block'>
                        <p
                          className={`text-xs font-semibold ${
                            isActive ? "text-white" : "text-slate-400"
                          }`}
                        >
                          {step.title}
                        </p>
                      </div>
                    </div>
                    {/* Connector Line */}
                    {!isLast && (
                      <div
                        className={`absolute left-[50%] right-0 h-0.5 top-[20px] transition-all duration-200 ${
                          isCompleted
                            ? "bg-orange-500"
                            : "bg-slate-200 dark:bg-slate-700"
                        }`}
                        style={{ width: "calc(100% - 2.5rem)" }}
                      />
                    )}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <div className='bg-slate-900/50 backdrop-blur-xl rounded-2xl shadow-xl border border-white/5 p-6 flex-1 flex flex-col z-20'>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (currentStep === 3) {
                form.handleSubmit(onSubmit, (errors) => {
                  console.error("Form validation errors:", errors);
                  const errorMessages = Object.values(errors)
                    .map((err: { message: string }) => err.message)
                    .join(", ");
                  setError(`Validation failed: ${errorMessages}`);
                })(e);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && currentStep !== 3) {
                e.preventDefault();
              }
            }}
            className='flex-1 flex flex-col'
          >
            <div className='flex-1'>
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className='space-y-6 animate-in fade-in slide-in-from-right-4 duration-200'>
                  <div>
                    <h3 className='text-xl font-bold text-white mb-2'>
                      Basic Information
                    </h3>
                    <p className='text-slate-400 mb-6'>
                      Give your activity a descriptive title and select the
                      date.
                    </p>

                    <div className='space-y-4'>
                      <div>
                        <label className='block text-sm font-medium text-slate-300 mb-2'>
                          Activity Title
                        </label>
                        <input
                          type='text'
                          {...form.register("title")}
                          placeholder='e.g., Louvre Museum Tour'
                          className='w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all'
                          autoFocus
                        />
                        {form.formState.errors.title && (
                          <p className='mt-2 text-sm text-red-400'>
                            {form.formState.errors.title.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-slate-300 mb-2'>
                          Date
                        </label>
                        <select
                          {...form.register("date")}
                          className='w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all appearance-none'
                        >
                          {availableDates.map((d) => (
                            <option
                              key={d.toISOString()}
                              value={d.toISOString().split("T")[0]}
                            >
                              {d.toLocaleDateString("en-US", {
                                weekday: "long",
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Time & Details */}
              {currentStep === 2 && (
                <div className='space-y-6 animate-in fade-in slide-in-from-right-4 duration-200'>
                  <div>
                    <h3 className='text-xl font-bold text-white mb-2'>
                      Time & Details
                    </h3>
                    <p className='text-slate-400 mb-6'>
                      Set the time range and add any specific notes.
                    </p>

                    <div className='grid grid-cols-2 gap-4 mb-6'>
                      <div>
                        <label className='block text-sm font-medium text-slate-300 mb-2'>
                          Start Time
                        </label>
                        <Input
                          type='time'
                          {...form.register("startTime")}
                          className='w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all h-auto'
                        />
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-slate-300 mb-2'>
                          End Time
                        </label>
                        <Input
                          type='time'
                          {...form.register("endTime")}
                          className='w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all h-auto'
                        />
                      </div>
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-slate-300 mb-2'>
                        Notes
                      </label>
                      <textarea
                        {...form.register("notes")}
                        placeholder='Add details, reservation numbers, etc...'
                        rows={5}
                        className='w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none'
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Transportation */}
              {currentStep === 3 && (
                <div className='space-y-6 animate-in fade-in slide-in-from-right-4 duration-200'>
                  <div>
                    <h3 className='text-xl font-bold text-white mb-2'>
                      Transportation
                    </h3>
                    <p className='text-slate-400 mb-6'>
                      Optional travel details for getting there or getting
                      around.
                    </p>

                    <div className='space-y-4'>
                      <div>
                        <label className='block text-sm font-medium text-slate-300 mb-2'>
                          Mode of Transportation
                        </label>
                        <Select
                          value={form.watch("transportationMode") || ""}
                          onValueChange={(value) => {
                            const modeValue =
                              value === ""
                                ? undefined
                                : (value as (typeof transportationModes)[number]);
                            form.setValue("transportationMode", modeValue, {
                              shouldValidate: false,
                            });
                          }}
                        >
                          <SelectTrigger className='w-full h-12 bg-slate-800 border-slate-700 rounded-xl text-white'>
                            <SelectValue placeholder='Select mode...' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='commute'>
                              🚌 Commute (Public Transport)
                            </SelectItem>
                            <SelectItem value='car'>
                              🚗 Car (Private Vehicle)
                            </SelectItem>
                            <SelectItem value='plane'>
                              ✈️ Plane (Air Travel)
                            </SelectItem>
                            <SelectItem value='bus'>🚌 Bus</SelectItem>
                            <SelectItem value='train'>🚊 Train</SelectItem>
                            <SelectItem value='taxi'>
                              🚕 Taxi/Rideshare
                            </SelectItem>
                            <SelectItem value='walking'>🚶 Walking</SelectItem>
                            <SelectItem value='other'>Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Dynamic Transportation Fields */}
                      {form.watch("transportationMode") && (
                        <div className='space-y-4 pt-4 border-t border-slate-700 animate-in fade-in slide-in-from-top-2'>
                          {/* Pickup Time */}
                          {form.watch("transportationMode") !== "plane" &&
                            form.watch("transportationMode") !== "walking" && (
                              <div>
                                <label className='block text-sm font-medium text-slate-300 mb-2'>
                                  Pickup Time
                                </label>
                                <input
                                  type='time'
                                  {...form.register("pickupTime")}
                                  className='w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all'
                                />
                              </div>
                            )}

                          {/* Locations */}
                          {form.watch("transportationMode") !== "plane" &&
                            form.watch("transportationMode") !== "walking" && (
                              <>
                                <div>
                                  <label className='block text-sm font-medium text-slate-300 mb-2'>
                                    Pickup Location
                                  </label>
                                  <input
                                    type='text'
                                    {...form.register("pickupLocation")}
                                    placeholder='e.g. Hotel Lobby'
                                    className='w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all'
                                  />
                                </div>
                                <div>
                                  <label className='block text-sm font-medium text-slate-300 mb-2'>
                                    Dropoff Location
                                  </label>
                                  <input
                                    type='text'
                                    {...form.register("dropoffLocation")}
                                    placeholder='e.g. Activity Site'
                                    className='w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all'
                                  />
                                </div>
                              </>
                            )}

                          {/* Flight Fields */}
                          {form.watch("transportationMode") === "plane" && (
                            <>
                              <div className='grid grid-cols-2 gap-4'>
                                <div>
                                  <label className='block text-sm font-medium text-slate-300 mb-2'>
                                    Departure Airport
                                  </label>
                                  <input
                                    type='text'
                                    {...form.register("pickupLocation")}
                                    placeholder='e.g. JFK'
                                    className='w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all'
                                  />
                                </div>
                                <div>
                                  <label className='block text-sm font-medium text-slate-300 mb-2'>
                                    Arrival Airport
                                  </label>
                                  <input
                                    type='text'
                                    {...form.register("dropoffLocation")}
                                    placeholder='e.g. LHR'
                                    className='w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all'
                                  />
                                </div>
                              </div>
                              <div>
                                <label className='block text-sm font-medium text-slate-300 mb-2'>
                                  Departure Time
                                </label>
                                <input
                                  type='time'
                                  {...form.register("pickupTime")}
                                  className='w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all'
                                />
                              </div>
                            </>
                          )}

                          <button
                            type='button'
                            onClick={handleSkipTransportation}
                            className='text-sm text-red-500 hover:text-red-600 font-medium pt-2'
                          >
                            Clear Transportation Details
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* General Error Message */}
            {error && (
              <div className='mt-4 p-4 bg-red-900/20 text-red-400 rounded-xl text-sm border border-red-800'>
                {error}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className='flex items-center justify-between gap-4 pt-6 border-t border-slate-700 mt-6'>
              <div className='flex items-center gap-2'>
                {currentStep > 1 && (
                  <button
                    key='back-button'
                    type='button'
                    onClick={handlePrevious}
                    disabled={isLoading}
                    className='px-4 py-2 border border-slate-700 rounded-xl text-slate-300 hover:bg-slate-700 transition-all font-medium flex items-center gap-2'
                  >
                    <ChevronLeft className='w-4 h-4' />
                    Back
                  </button>
                )}
                {currentStep === 3 && (
                  <button
                    key='skip-button'
                    type='button'
                    onClick={handleSkipTransportation}
                    disabled={isLoading}
                    className='px-4 py-2 text-slate-400 hover:text-slate-200 font-medium text-sm'
                  >
                    Skip
                  </button>
                )}
              </div>

              {currentStep < 3 ? (
                <button
                  key='next-button'
                  type='button'
                  onClick={handleNext}
                  disabled={isLoading}
                  className='px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2'
                >
                  Next
                  <ChevronRight className='w-4 h-4' />
                </button>
              ) : (
                <button
                  key='submit-button'
                  type='submit'
                  disabled={isLoading}
                  className='px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-orange-500/25'
                >
                  {isLoading ? "Saving Changes..." : "Save Changes"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

export default EditActivityPage;
