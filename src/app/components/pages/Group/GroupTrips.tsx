import { Calendar, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getTripStatus } from "@/lib/utils/tripStatus";
import type { Trip } from "@/src/shared/types";
import { PILL } from "../../shared/Pills";
import { fullRange, tripWhen } from "../../shared/tripDates";

function TripCard({ trip, href, today }: { trip: Trip; href: string; today: Date }) {
  const status = getTripStatus(trip.status);
  const activities = trip.activities?.length ?? 0;

  return (
    <Link
      href={href}
      className='flex flex-col gap-[14px] rounded-[20px] border border-white/[.08] bg-[rgba(15,23,42,.6)] p-[18px] text-inherit transition-[border-color] hover:border-white/[.18]'
    >
      <span className='flex items-center justify-between gap-[10px]'>
        <span className={cn("rounded-full border px-[10px] py-1 text-[11px] font-bold", status.pill)}>{status.label}</span>
        <span className='font-mono text-[11px] text-[#94a3b8]'>{tripWhen(trip, today)}</span>
      </span>
      <span className='flex flex-col gap-[6px]'>
        <span className='text-[22px] font-extrabold tracking-[-.02em]'>{trip.name}</span>
        <span className='flex flex-wrap gap-x-4 gap-y-[6px] text-[13px] text-[#94a3b8]'>
          {trip.location ? (
            <span className='flex items-center gap-[6px]'>
              <MapPin className='size-[14px]' />
              {trip.location}
            </span>
          ) : null}
          <span className='flex items-center gap-[6px]'>
            <Calendar className='size-[14px]' />
            {fullRange(trip)}
          </span>
        </span>
      </span>
      <span className='border-t border-white/[.06] pt-3 text-xs text-[#64748b]'>
        {activities} {activities === 1 ? "activity" : "activities"}
        {trip.createdBy ? ` · by ${trip.createdBy}` : ""}
      </span>
    </Link>
  );
}

interface GroupTripsProps {
  trips: Trip[];
  today: Date;
  tripHref: (tripId: string) => string;
  /** Where "New trip" leads; omit for a read-only viewer. */
  newTripHref?: string;
}

/** The group's trips as cards, with a New trip pill and a dashed empty state. */
export function GroupTrips({ trips, today, tripHref, newTripHref }: GroupTripsProps) {
  const sorted = [...trips].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  return (
    <div className='flex min-w-0 flex-[999_1_460px] flex-col gap-3'>
      <div className='flex items-center justify-between gap-3'>
        <h2 className='text-lg font-bold'>Trips</h2>
        {newTripHref ? (
          <Link href={newTripHref} className={PILL.amber}>
            <Plus className='size-[14px]' strokeWidth={2.4} />
            New trip
          </Link>
        ) : null}
      </div>

      {sorted.map((trip) => (
        <TripCard key={trip.id} trip={trip} href={tripHref(trip.id)} today={today} />
      ))}

      {sorted.length === 0 ? (
        <div className='flex flex-col items-center gap-[10px] rounded-[20px] border border-dashed border-white/[.14] p-7 text-center'>
          <span className='text-base font-bold'>No trips yet</span>
          <span className='max-w-[28em] text-sm text-[#94a3b8]'>
            Pick some dates and a place. Everyone in the group sees it the moment you save.
          </span>
          {newTripHref ? (
            <Link href={newTripHref} className={cn(PILL.amber, "mt-[6px] px-4 py-[9px]")}>
              Plan the first trip
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
