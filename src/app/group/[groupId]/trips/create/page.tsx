"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createTripSchema,
  TCreateTripSchema,
} from "@/src/app/components/shared/Modal/CreateTripModal/createTripZod";
import NavigationLoader from "@/src/app/components/shared/NavigationLoader";
import PremiumPageHeader from "@/src/app/components/shared/PremiumPageHeader";
import { useCreateTrip } from "@/src/hooks/useTrips";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Check, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface CreateTripPageProps {
  params: {
    groupId: string;
  };
}

const STATUS_OPTIONS: Array<{
  value: TCreateTripSchema["status"];
  label: string;
  helper: string;
}> = [
  { value: "planning", label: "Planning", helper: "Collect ideas and build itinerary" },
  { value: "finalized", label: "Finalized", helper: "Major details are confirmed" },
  { value: "ongoing", label: "Ongoing", helper: "Trip is happening right now" },
  { value: "cancelled", label: "Cancelled", helper: "Trip is no longer happening" },
];

const CreateTripPage = ({ params }: CreateTripPageProps) => {
  const { groupId } = params;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const createTrip = useCreateTrip(groupId);

  const form = useForm<TCreateTripSchema>({
    resolver: zodResolver(createTripSchema),
    defaultValues: {
      tripName: "",
      location: "",
      startDate: "",
      endDate: "",
      status: "planning",
    },
  });

  const selectedStatus = form.watch("status");
  const tripName = form.watch("tripName");
  const location = form.watch("location");
  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");

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

      if (result.trip) {
        setIsNavigating(true);
        await new Promise((resolve) => setTimeout(resolve, 250));
        router.push(`/group/${groupId}/trip/${result.trip.id}`);
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String(err.message)
          : "Failed to create trip";
      setError(message);
      setIsNavigating(false);
    }
  };

  const isLoading = createTrip.isPending || isNavigating;

  return (
    <main className='min-h-screen bg-slate-950 pb-20'>
      {isNavigating && <NavigationLoader message='Creating trip...' />}

      <div className='mx-auto w-full max-w-5xl px-3 pt-4 sm:px-4 sm:pt-6'>
        <PremiumPageHeader onBack={() => router.back()} title='Create Trip' />

        <div className='mt-5 grid gap-6 lg:grid-cols-[1fr_280px]'>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <section className='border border-slate-800 rounded-xl p-4 sm:p-5'>
              <h2 className='text-base font-semibold text-white'>Trip details</h2>
              <p className='mt-1 text-sm text-slate-400'>
                Start with a name, destination, and dates.
              </p>

              <div className='mt-5 space-y-4'>
                <div className='space-y-2'>
                  <Label
                    htmlFor='tripName'
                    className={
                      form.formState.errors.tripName ? "text-red-400" : "text-slate-200"
                    }
                  >
                    Trip name
                  </Label>
                  <Input
                    id='tripName'
                    type='text'
                    {...form.register("tripName")}
                    placeholder='e.g. Tokyo Spring 2026'
                    className={`h-11 border rounded-lg bg-slate-900 text-white placeholder:text-slate-500 focus-visible:ring-1 ${
                      form.formState.errors.tripName
                        ? "border-red-500 focus-visible:ring-red-500"
                        : "border-slate-700 focus-visible:ring-slate-500"
                    }`}
                  />
                  {form.formState.errors.tripName && (
                    <p className='text-xs text-red-400'>
                      {form.formState.errors.tripName.message}
                    </p>
                  )}
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='location' className='text-slate-200'>
                    Location <span className='text-slate-500'>(optional)</span>
                  </Label>
                  <div className='relative'>
                    <MapPin className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500' />
                    <Input
                      id='location'
                      type='text'
                      {...form.register("location")}
                      placeholder='e.g. Tokyo, Japan'
                      className='h-11 border border-slate-700 rounded-lg bg-slate-900 pl-9 text-white placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-slate-500'
                    />
                  </div>
                </div>

                <div className='grid gap-4 sm:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label
                      htmlFor='startDate'
                      className={
                        form.formState.errors.startDate
                          ? "text-red-400"
                          : "text-slate-200"
                      }
                    >
                      Start date
                    </Label>
                    <Input
                      id='startDate'
                      type='date'
                      {...form.register("startDate")}
                      className={`h-11 border rounded-lg bg-slate-900 text-white focus-visible:ring-1 ${
                        form.formState.errors.startDate
                          ? "border-red-500 focus-visible:ring-red-500"
                          : "border-slate-700 focus-visible:ring-slate-500"
                      }`}
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label
                      htmlFor='endDate'
                      className={
                        form.formState.errors.endDate ? "text-red-400" : "text-slate-200"
                      }
                    >
                      End date
                    </Label>
                    <Input
                      id='endDate'
                      type='date'
                      {...form.register("endDate")}
                      className={`h-11 border rounded-lg bg-slate-900 text-white focus-visible:ring-1 ${
                        form.formState.errors.endDate
                          ? "border-red-500 focus-visible:ring-red-500"
                          : "border-slate-700 focus-visible:ring-slate-500"
                      }`}
                    />
                  </div>
                </div>

                {(form.formState.errors.startDate || form.formState.errors.endDate) && (
                  <p className='text-xs text-red-400'>
                    Please select a valid date range.
                  </p>
                )}
              </div>
            </section>

            <section className='border border-slate-800 rounded-xl p-4 sm:p-5'>
              <h2 className='text-base font-semibold text-white'>Trip status</h2>
              <p className='mt-1 text-sm text-slate-400'>
                Set current progress. You can change this later.
              </p>

              <div className='mt-4 grid gap-2'>
                {STATUS_OPTIONS.map((option) => {
                  const active = selectedStatus === option.value;

                  return (
                    <label
                      key={option.value}
                      className={`cursor-pointer rounded-lg border px-3 py-3 transition-colors ${
                        active
                          ? "border-slate-500 bg-slate-900"
                          : "border-slate-800 hover:bg-slate-900"
                      }`}
                    >
                      <input
                        type='radio'
                        value={option.value}
                        {...form.register("status")}
                        className='sr-only'
                      />
                      <div className='flex items-start justify-between gap-3'>
                        <div>
                          <p className='text-sm font-medium text-white'>{option.label}</p>
                          <p className='text-xs text-slate-400 mt-0.5'>{option.helper}</p>
                        </div>
                        {active && <Check className='h-4 w-4 text-slate-300 mt-0.5' />}
                      </div>
                    </label>
                  );
                })}
              </div>
            </section>

            {error && (
              <div className='rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300'>
                {error}
              </div>
            )}

            <div className='sticky bottom-3 z-10 rounded-xl border border-slate-800 bg-slate-950/95 p-2 backdrop-blur supports-[backdrop-filter]:bg-slate-950/80'>
              <button
                type='submit'
                disabled={isLoading}
                className='w-full rounded-lg bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isLoading ? "Loading" : "Create Trip"}
              </button>
            </div>
          </form>

          <aside className='h-fit rounded-xl border border-slate-800 p-4 lg:sticky lg:top-6'>
            <h3 className='text-sm font-semibold text-white'>Preview</h3>

            <div className='mt-4 space-y-3 text-sm'>
              <div>
                <p className='text-xs uppercase tracking-[0.12em] text-slate-500'>Name</p>
                <p className='mt-1 text-slate-200'>{tripName || "Untitled trip"}</p>
              </div>

              <div>
                <p className='text-xs uppercase tracking-[0.12em] text-slate-500'>Location</p>
                <p className='mt-1 text-slate-300'>{location || "Not set"}</p>
              </div>

              <div>
                <p className='text-xs uppercase tracking-[0.12em] text-slate-500'>Dates</p>
                <div className='mt-1 flex items-center gap-2 text-slate-300'>
                  <Calendar className='h-3.5 w-3.5 text-slate-500' />
                  <span>
                    {startDate || "Start"} to {endDate || "End"}
                  </span>
                </div>
              </div>

              <div>
                <p className='text-xs uppercase tracking-[0.12em] text-slate-500'>Status</p>
                <p className='mt-1 text-slate-200'>
                  {STATUS_OPTIONS.find((option) => option.value === selectedStatus)?.label}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default CreateTripPage;
