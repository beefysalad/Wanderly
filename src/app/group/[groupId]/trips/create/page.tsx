"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createTripSchema,
  TCreateTripSchema,
} from "@/src/app/components/shared/Modal/CreateTripModal/createTripZod";
import NavigationLoader from "@/src/app/components/shared/NavigationLoader";
import PremiumBackground from "@/src/app/components/shared/PremiumBackground";
import PremiumPageHeader from "@/src/app/components/shared/PremiumPageHeader";
import { useCreateTrip } from "@/src/hooks/useTrips";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Info, Layout, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface CreateTripPageProps {
  params: {
    groupId: string;
  };
}

const CreateTripPage = ({ params }: CreateTripPageProps) => {
  const { groupId } = params;
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

      // Navigate to the new trip
      if (result.trip) {
        setIsNavigating(true);
        // Wait a moment for cache to update and show feedback
        await new Promise((resolve) => setTimeout(resolve, 300));
        router.push(`/group/${groupId}/trip/${result.trip.id}`);
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
    <main className='h-screen bg-slate-950 flex flex-col relative overflow-hidden'>
      <PremiumBackground />
      {isNavigating && <NavigationLoader message='Creating trip...' />}

      {/* Header */}
      <div className='flex-shrink-0 z-20'>
        <div className='max-w-xl mx-auto px-4 py-4 md:py-6'>
          <PremiumPageHeader onBack={() => router.back()} title='NEW TRIP' />
        </div>
      </div>

      <div className='flex-1 w-full max-w-xl mx-auto px-4 pb-24 relative z-10 overflow-y-auto custom-scrollbar'>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          {/* Trip Details Section */}
          <div className='bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 border border-white/5 space-y-5'>
            <h2 className='text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2'>
              <Info className='w-4 h-4' /> Trip Details
            </h2>

            <div className='space-y-2'>
              <Label
                htmlFor='tripName'
                className={`${
                  form.formState.errors.tripName
                    ? "text-red-400"
                    : "text-slate-300"
                } transition-colors`}
              >
                Trip Name
              </Label>
              <Input
                id='tripName'
                type='text'
                {...form.register("tripName")}
                placeholder='e.g. Vietnam 2026'
                className={`w-full px-4 py-3.5 border rounded-xl bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                  form.formState.errors.tripName
                    ? "border-red-500 focus:ring-red-500/20"
                    : "border-white/10 focus:ring-orange-500 focus:border-orange-500"
                }`}
              />
              {form.formState.errors.tripName && (
                <p className='text-xs text-red-400 mt-1'>
                  {form.formState.errors.tripName.message}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='location' className='text-slate-300'>
                Location{" "}
                <span className='text-slate-500 text-xs ml-1'>(Optional)</span>
              </Label>
              <div className='relative'>
                <MapPin className='absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500' />
                <Input
                  id='location'
                  type='text'
                  {...form.register("location")}
                  placeholder='Where are you going?'
                  className='w-full pl-10 pr-4 py-3.5 border border-white/10 rounded-xl bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                />
              </div>
            </div>
          </div>

          {/* Dates Section */}
          <div className='bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 border border-white/5 space-y-5'>
            <h2 className='text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2'>
              <Calendar className='w-4 h-4' /> Schedule
            </h2>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label
                  htmlFor='startDate'
                  className={`${
                    form.formState.errors.startDate
                      ? "text-red-400"
                      : "text-slate-300"
                  } transition-colors`}
                >
                  Start Date
                </Label>
                <Input
                  id='startDate'
                  type='date'
                  {...form.register("startDate")}
                  className={`w-full px-4 py-3.5 border rounded-xl bg-slate-800/50 text-white text-sm focus:outline-none focus:ring-2 transition-all [-webkit-appearance:none] [appearance:none] min-h-[50px] ${
                    form.formState.errors.startDate
                      ? "border-red-500 focus:ring-red-500/20"
                      : "border-white/10 focus:ring-orange-500 focus:border-orange-500"
                  }`}
                />
              </div>
              <div className='space-y-2'>
                <Label
                  htmlFor='endDate'
                  className={`${
                    form.formState.errors.endDate
                      ? "text-red-400"
                      : "text-slate-300"
                  } transition-colors`}
                >
                  End Date
                </Label>
                <Input
                  id='endDate'
                  type='date'
                  {...form.register("endDate")}
                  className={`w-full px-4 py-3.5 border rounded-xl bg-slate-800/50 text-white text-sm focus:outline-none focus:ring-2 transition-all [-webkit-appearance:none] [appearance:none] min-h-[50px] ${
                    form.formState.errors.endDate
                      ? "border-red-500 focus:ring-red-500/20"
                      : "border-white/10 focus:ring-orange-500 focus:border-orange-500"
                  }`}
                />
              </div>
            </div>
            {(form.formState.errors.startDate ||
              form.formState.errors.endDate) && (
              <p className='text-xs text-red-400'>
                Please select valid start and end dates.
              </p>
            )}
          </div>

          {/* Status Section */}
          <div className='bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 border border-white/5 space-y-5'>
            <h2 className='text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2'>
              <Layout className='w-4 h-4' /> Status
            </h2>

            <div className='grid grid-cols-2 gap-3'>
              {["planning", "finalized", "ongoing", "cancelled"].map(
                (statusOption) => (
                  <label
                    key={statusOption}
                    className={`relative flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${
                      form.watch("status") === statusOption
                        ? "bg-orange-500/10 border-orange-500 text-orange-400 font-bold"
                        : "bg-slate-800/30 border-white/5 text-slate-400 hover:bg-slate-800/50"
                    }`}
                  >
                    <input
                      type='radio'
                      value={statusOption}
                      {...form.register("status")}
                      className='sr-only'
                    />
                    <span className='capitalize'>{statusOption}</span>
                  </label>
                ),
              )}
            </div>
          </div>

          {/* General Error Message */}
          {error && (
            <div className='p-4 bg-red-500/10 text-red-400 rounded-xl text-sm border border-red-500/20 flex items-start gap-2'>
              <div className='mt-0.5 min-w-[16px]'>⚠️</div>
              <p>{error}</p>
            </div>
          )}

          <div className='pt-4 pb-8'>
            <button
              type='submit'
              disabled={isLoading}
              className='w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl font-bold text-lg transition-all shadow-lg hover:shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0'
            >
              {isLoading
                ? createTrip.isPending
                  ? "Creating Trip..."
                  : "Redirecting..."
                : "Create Trip"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default CreateTripPage;
