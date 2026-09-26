"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import { getVibeInfo } from "@/lib/utils/groupColors";
import { useGroup } from "@/src/hooks/useGroups";
import { useCreateTrip } from "@/src/hooks/useTrips";
import { AppShell } from "../../shared/AppShell/AppShell";
import { CHIP, CHIP_OFF, CHIP_ON, FIELD_ERROR, FIELD_LABEL, INPUT, SUBMIT_BUTTON } from "../../shared/formStyles";
import { createTripSchema, type TCreateTripSchema } from "../../shared/Modal/CreateTripModal/createTripZod";
import NavigationLoader from "../../shared/NavigationLoader";

const STATUS_OPTIONS: Array<{ value: TCreateTripSchema["status"]; label: string }> = [
  { value: "planning", label: "Planning" },
  { value: "finalized", label: "Finalized" },
  { value: "ongoing", label: "Ongoing" },
  { value: "cancelled", label: "Cancelled" },
];

export default function CreateTrip({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const createTrip = useCreateTrip(groupId);
  const { data } = useGroup(groupId);
  const group = data?.group;

  const form = useForm<TCreateTripSchema>({
    resolver: zodResolver(createTripSchema),
    defaultValues: { tripName: "", location: "", startDate: "", endDate: "", status: "planning" },
  });
  const { errors } = form.formState;
  const status = form.watch("status");

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
      setError(err && typeof err === "object" && "message" in err ? String(err.message) : "Failed to create trip");
      setIsNavigating(false);
    }
  };

  const isLoading = createTrip.isPending || isNavigating;

  return (
    <AppShell level='detail' back={{ href: `/group/${groupId}`, crumb: `${group?.name ?? "Group"} · Trips` }}>
      {isNavigating && <NavigationLoader message='Creating trip...' />}
      <form onSubmit={form.handleSubmit(onSubmit)} className='flex max-w-[600px] flex-col gap-[22px]'>
        <div>
          {group ? (
            <p className='mb-2 font-mono text-[10px] uppercase tracking-[.16em] text-[#64748b]'>
              {group.emoji || getVibeInfo(group.colorScheme).emoji} {group.name}
            </p>
          ) : null}
          <h1 className='text-[clamp(28px,4.4cqw,40px)] font-extrabold leading-[1.05] tracking-[-.03em]'>New trip</h1>
        </div>

        <label className='flex flex-col gap-[7px]'>
          <span className={FIELD_LABEL}>Trip name</span>
          <input {...form.register("tripName")} placeholder='e.g. Siargao' className={INPUT} />
          {errors.tripName ? <span className={FIELD_ERROR}>{errors.tripName.message}</span> : null}
        </label>

        <label className='flex flex-col gap-[7px]'>
          <span className={FIELD_LABEL}>Location (optional)</span>
          <input {...form.register("location")} placeholder='e.g. General Luna, Siargao' className={INPUT} />
        </label>

        <div className='grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-3'>
          <label className='flex flex-col gap-[7px]'>
            <span className={FIELD_LABEL}>Starts</span>
            <input type='date' {...form.register("startDate")} className={INPUT} />
            {errors.startDate ? <span className={FIELD_ERROR}>{errors.startDate.message}</span> : null}
          </label>
          <label className='flex flex-col gap-[7px]'>
            <span className={FIELD_LABEL}>Ends</span>
            <input type='date' {...form.register("endDate")} className={INPUT} />
            {errors.endDate ? <span className={FIELD_ERROR}>{errors.endDate.message}</span> : null}
          </label>
        </div>

        <div className='flex flex-col gap-[9px]'>
          <span className={FIELD_LABEL}>Status</span>
          <div className='flex flex-wrap gap-[6px]'>
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type='button'
                onClick={() => form.setValue("status", option.value)}
                aria-pressed={status === option.value}
                className={cn(CHIP, status === option.value ? CHIP_ON : CHIP_OFF)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className='rounded-xl border border-[rgba(248,113,113,.3)] bg-[rgba(248,113,113,.08)] px-4 py-3 text-sm text-[#fecaca]'>
            {error}
          </div>
        ) : null}

        <button type='submit' disabled={isLoading} className={SUBMIT_BUTTON}>
          {isLoading ? <Loader2 className='size-5 animate-spin' /> : null}
          Create trip
        </button>
      </form>
    </AppShell>
  );
}
