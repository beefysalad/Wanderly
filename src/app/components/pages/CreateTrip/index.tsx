"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { cn } from "@/src/lib/utils";
import { getVibeInfo } from "@/src/lib/utils/groupColors";
import { useGroup } from "@/src/hooks/useGroups";
import { useCreateTrip } from "@/src/hooks/useTrips";
import { AppShell } from "../../shared/AppShell/AppShell";
import { CHIP, CHIP_OFF, CHIP_ON, FIELD_LABEL, SUBMIT_BUTTON } from "../../shared/formStyles";
import { tripDetailsSchema, type TCreateTripSchema, type TTripDetailsSchema } from "./createTripZod";
import NavigationLoader from "../../shared/NavigationLoader";
import { TripDetailsFields } from "../../shared/TripForm/TripDetailsFields";

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
  const [status, setStatus] = useState<TCreateTripSchema["status"]>("planning");
  const createTrip = useCreateTrip(groupId);
  const { data } = useGroup(groupId);
  const group = data?.group;

  const form = useForm<TTripDetailsSchema>({
    resolver: zodResolver(tripDetailsSchema),
    defaultValues: { tripName: "", location: "", startDate: "", endDate: "" },
  });
  const { errors } = form.formState;

  const onSubmit = async (values: TTripDetailsSchema) => {
    try {
      setError(null);
      const result = await createTrip.mutateAsync({
        tripName: values.tripName,
        startDate: values.startDate,
        endDate: values.endDate,
        location: values.location,
        status,
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

        <TripDetailsFields register={form.register} errors={errors} />

        <div className='flex flex-col gap-[9px]'>
          <span className={FIELD_LABEL}>Status</span>
          <div className='flex flex-wrap gap-[6px]'>
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type='button'
                onClick={() => setStatus(option.value)}
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
