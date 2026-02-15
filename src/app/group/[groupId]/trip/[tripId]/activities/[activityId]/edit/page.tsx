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
  Navigation,
  ArrowLeft,
  Loader2,
  Save,
  MapPin,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateActivity } from "@/src/hooks/useActivities";
import { useRouter } from "next/navigation";
import { useGroup } from "@/src/hooks/useGroups";
import { Trip, Activity } from "@/src/shared/types";
import NavigationLoader from "@/src/app/components/shared/NavigationLoader";
import DashboardLayoutHeader from "@/src/app/components/shared/DashboardLayoutHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

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

interface EditActivityPageProps {
  params: Promise<{
    groupId: string;
    tripId: string;
    activityId: string;
  }>;
}

const EditActivityPage = ({ params }: EditActivityPageProps) => {
  const { groupId, tripId, activityId } = React.use(params);
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
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

  const handleSkipTransportation = () => {
    // Clear transportation fields
    form.setValue("transportationMode", undefined);
    form.setValue("pickupTime", undefined);
    form.setValue("pickupLocation", undefined);
    form.setValue("dropoffLocation", undefined);
  };

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
        <div className='absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/[0.02] rounded-full blur-3xl'></div>
        <div className='absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/[0.02] rounded-full blur-3xl'></div>
      </div>
      {isNavigating && <NavigationLoader message='Updating activity...' />}

      <div className='max-w-4xl mx-auto w-full px-4 relative z-20'>
        <DashboardLayoutHeader showBack={true} title='Edit Activity' />
      </div>

      <div className='flex-1 overflow-y-auto px-4 py-6 pb-24 max-w-4xl mx-auto w-full'>
        <div className='max-w-3xl mx-auto space-y-8'>
          <form className='space-y-8'>
            {/* Basic Info Section */}
            <section className='bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm'>
              <div className='flex items-center gap-2 mb-6'>
                <Calendar className='w-5 h-5 text-orange-500' />
                <h2 className='text-lg font-semibold text-white'>
                  Basic Information
                </h2>
              </div>

              <div className='space-y-4'>
                <div className='space-y-2'>
                  <Label className='text-slate-300'>Activity Title</Label>
                  <Input
                    {...form.register("title")}
                    placeholder='e.g., Louvre Museum Tour'
                    className='bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-orange-500'
                  />
                  {form.formState.errors.title && (
                    <p className='text-sm text-red-400'>
                      {form.formState.errors.title.message}
                    </p>
                  )}
                </div>

                <div className='space-y-2'>
                  <Label className='text-slate-300'>Date</Label>
                  <Select
                    value={form.watch("date")}
                    onValueChange={(value) => form.setValue("date", value)}
                  >
                    <SelectTrigger className='bg-slate-800 border-slate-700 text-white focus:ring-orange-500'>
                      <SelectValue placeholder='Select date' />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDates.map((d) => (
                        <SelectItem
                          key={d.toISOString()}
                          value={d.toISOString().split("T")[0]}
                        >
                          {d.toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                          })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.date && (
                    <p className='text-sm text-red-400'>
                      {form.formState.errors.date.message}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Time & Notes Section */}
            <section className='bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm'>
              <div className='flex items-center gap-2 mb-6'>
                <Clock className='w-5 h-5 text-blue-500' />
                <h2 className='text-lg font-semibold text-white'>
                  Time & Details
                </h2>
              </div>

              <div className='space-y-6'>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label className='text-slate-300'>Start Time</Label>
                    <Input
                      type='time'
                      {...form.register("startTime")}
                      className='bg-slate-800 border-slate-700 text-white focus-visible:ring-orange-500 h-auto py-3'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-slate-300'>End Time</Label>
                    <Input
                      type='time'
                      {...form.register("endTime")}
                      className='bg-slate-800 border-slate-700 text-white focus-visible:ring-orange-500 h-auto py-3'
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label className='text-slate-300'>Notes</Label>
                  <textarea
                    {...form.register("notes")}
                    placeholder='Add details, reservation numbers, etc...'
                    rows={4}
                    className='w-full px-3 py-2 border border-slate-700 rounded-md bg-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-y min-h-[100px] text-sm'
                  />
                </div>
              </div>
            </section>

            {/* Transportation Section */}
            <section className='bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm'>
              <div className='flex items-center justify-between mb-6'>
                <div className='flex items-center gap-2'>
                  <Navigation className='w-5 h-5 text-emerald-500' />
                  <h2 className='text-lg font-semibold text-white'>
                    Transportation
                  </h2>
                </div>
                {form.watch("transportationMode") && (
                  <Button
                    type='button'
                    variant='ghost'
                    onClick={handleSkipTransportation}
                    className='text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 px-2 text-xs'
                  >
                    <Trash2 className='w-3 h-3 mr-1' />
                    Clear
                  </Button>
                )}
              </div>

              <div className='space-y-6'>
                <div className='space-y-2'>
                  <Label className='text-slate-300'>Mode</Label>
                  <Select
                    value={form.watch("transportationMode") || ""}
                    onValueChange={(value) => {
                      const modeValue =
                        value === "" || value === "none"
                          ? undefined
                          : (value as (typeof transportationModes)[number]);
                      form.setValue("transportationMode", modeValue, {
                        shouldValidate: false,
                      });
                    }}
                  >
                    <SelectTrigger className='bg-slate-800 border-slate-700 text-white focus:ring-orange-500'>
                      <SelectValue placeholder='Select transportation mode...' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='none'>
                        None (No travel needed)
                      </SelectItem>
                      <SelectItem value='commute'>🚌 Commute</SelectItem>
                      <SelectItem value='car'>🚗 Car</SelectItem>
                      <SelectItem value='plane'>✈️ Plane</SelectItem>
                      <SelectItem value='bus'>🚌 Bus</SelectItem>
                      <SelectItem value='train'>🚊 Train</SelectItem>
                      <SelectItem value='taxi'>🚕 Taxi/Rideshare</SelectItem>
                      <SelectItem value='walking'>🚶 Walking</SelectItem>
                      <SelectItem value='other'>Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {form.watch("transportationMode") && (
                  <div className='space-y-4 animate-in fade-in slide-in-from-top-2 pt-4 border-t border-slate-800'>
                    {form.watch("transportationMode") === "plane" ? (
                      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <div className='space-y-2'>
                          <Label className='text-slate-300'>
                            Departure Airport
                          </Label>
                          <Input
                            {...form.register("pickupLocation")}
                            placeholder='e.g. JFK'
                            className='bg-slate-800 border-slate-700 text-white'
                          />
                        </div>
                        <div className='space-y-2'>
                          <Label className='text-slate-300'>
                            Arrival Airport
                          </Label>
                          <Input
                            {...form.register("dropoffLocation")}
                            placeholder='e.g. LHR'
                            className='bg-slate-800 border-slate-700 text-white'
                          />
                        </div>
                        <div className='space-y-2'>
                          <Label className='text-slate-300'>
                            Departure Time
                          </Label>
                          <Input
                            type='time'
                            {...form.register("pickupTime")}
                            className='bg-slate-800 border-slate-700 text-white h-auto py-3'
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Pickup/Dropoff for non-planes */}
                        {form.watch("transportationMode") !== "walking" && (
                          <>
                            <div className='space-y-2'>
                              <Label className='text-slate-300'>
                                Pickup Time
                              </Label>
                              <Input
                                type='time'
                                {...form.register("pickupTime")}
                                className='bg-slate-800 border-slate-700 text-white h-auto py-3'
                              />
                            </div>
                            <div className='space-y-2'>
                              <Label className='text-slate-300'>
                                Pickup Location
                              </Label>
                              <div className='relative'>
                                <MapPin className='absolute left-3 top-3 w-4 h-4 text-slate-500' />
                                <Input
                                  {...form.register("pickupLocation")}
                                  placeholder='e.g. Hotel Lobby'
                                  className='bg-slate-800 border-slate-700 text-white pl-9'
                                />
                              </div>
                            </div>
                            <div className='space-y-2'>
                              <Label className='text-slate-300'>
                                Dropoff Location
                              </Label>
                              <div className='relative'>
                                <MapPin className='absolute left-3 top-3 w-4 h-4 text-slate-500' />
                                <Input
                                  {...form.register("dropoffLocation")}
                                  placeholder='e.g. Activity Site'
                                  className='bg-slate-800 border-slate-700 text-white pl-9'
                                />
                              </div>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Error Message */}
            {error && (
              <div className='p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm'>
                {error}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Floating Save Button */}
      <div className='fixed bottom-6 right-6 z-50'>
        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={isLoading}
          className='w-14 h-14 rounded-full shadow-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white p-0 flex items-center justify-center transition-transform hover:scale-105 active:scale-95'
          title='Save Changes'
        >
          {isLoading ? (
            <Loader2 className='w-6 h-6 animate-spin' />
          ) : (
            <Save className='w-6 h-6' />
          )}
        </Button>
      </div>
    </main>
  );
};

export default EditActivityPage;
