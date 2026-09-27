"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { Loader2, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useUpdateTrip } from "@/src/hooks/useTrips";
import type { Trip } from "@/src/shared/types";
import { SUBMIT_BUTTON } from "../../shared/formStyles";
import { tripDetailsSchema, type TTripDetailsSchema } from "../../shared/Modal/CreateTripModal/createTripZod";
import { TripDetailsFields } from "../../shared/TripForm/TripDetailsFields";
import { activitiesOutside, dateInputValue } from "../Trip/tripView";

const LISTED = 3;

interface EditTripFormProps {
  groupId: string;
  trip: Trip;
}

/** The trip's name, location and dates, prefilled; warns (without blocking) when the new dates leave activities out. */
export function EditTripForm({ groupId, trip }: EditTripFormProps) {
  const router = useRouter();
  const updateTrip = useUpdateTrip(groupId, trip.id);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<TTripDetailsSchema>({
    resolver: zodResolver(tripDetailsSchema),
    defaultValues: {
      tripName: trip.name,
      location: trip.location ?? "",
      startDate: dateInputValue(trip.startDate),
      endDate: dateInputValue(trip.endDate),
    },
  });
  const [startDate, endDate] = useWatch({ control: form.control, name: ["startDate", "endDate"] });
  const outside = activitiesOutside(trip.activities ?? [], startDate, endDate);

  const onSubmit = async (values: TTripDetailsSchema) => {
    setError(null);
    try {
      await updateTrip.mutateAsync({
        name: values.tripName,
        location: values.location || null,
        startDate: values.startDate,
        endDate: values.endDate,
      });
      toast.success("Trip updated");
      router.push(`/group/${groupId}/trip/${trip.id}`);
    } catch (err) {
      setError(
        (isAxiosError<{ error?: string }>(err) && err.response?.data?.error) || "Failed to update trip. Please try again.",
      );
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-[22px]'>
      <TripDetailsFields register={form.register} errors={form.formState.errors} />

      {outside.length > 0 ? (
        <div
          role='status'
          className='flex gap-3 rounded-xl border border-[rgba(251,191,36,.3)] bg-[rgba(251,191,36,.06)] px-4 py-3 text-sm text-[#fcd34d]'
        >
          <TriangleAlert className='mt-[2px] size-4 shrink-0' />
          <div>
            <p>
              {outside.length} {outside.length === 1 ? "activity falls" : "activities fall"} outside these dates and
              won&apos;t show on the itinerary until you move {outside.length === 1 ? "it" : "them"}.
            </p>
            <p className='mt-1 text-[#fde68a]/80'>
              {outside
                .slice(0, LISTED)
                .map((activity) => activity.title)
                .join(", ")}
              {outside.length > LISTED ? ` and ${outside.length - LISTED} more` : ""}
            </p>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className='rounded-xl border border-[rgba(248,113,113,.3)] bg-[rgba(248,113,113,.08)] px-4 py-3 text-sm text-[#fecaca]'>
          {error}
        </div>
      ) : null}

      <button type='submit' disabled={updateTrip.isPending} className={SUBMIT_BUTTON}>
        {updateTrip.isPending ? <Loader2 className='size-5 animate-spin' /> : null}
        Save changes
      </button>
    </form>
  );
}
