import Link from "next/link";
import { cn } from "@/lib/utils";
import { getVibeInfo } from "@/lib/utils/groupColors";
import { getGroupTheme } from "@/lib/utils/groupTheme";
import { getTripStatus } from "@/lib/utils/tripStatus";
import { fullRange, tripWhen, type TripWithGroup } from "../../shared/tripDates";

/** One trip in the list: group emoji tile, name, "group · dates", how soon, and its status. */
export function TripRow({ trip, today }: { trip: TripWithGroup; today: Date }) {
  const theme = getGroupTheme(trip.group.colorScheme);
  const status = getTripStatus(trip.status);

  return (
    <Link
      href={`/group/${trip.groupId}/trip/${trip.id}`}
      className='flex flex-wrap items-center gap-[14px] rounded-[18px] border border-white/[.08] bg-[rgba(15,23,42,.6)] p-[14px] text-inherit transition-[border-color] hover:border-white/[.18]'
    >
      <span className={cn("flex size-[46px] flex-none items-center justify-center rounded-[14px] border text-[22px]", theme.tile)}>
        {trip.group.emoji || getVibeInfo(trip.group.colorScheme).emoji}
      </span>
      <span className='flex min-w-0 flex-[1_1_180px] flex-col gap-[3px]'>
        <span className='truncate text-base font-bold'>{trip.name}</span>
        <span className='truncate text-[13px] text-[#94a3b8]'>
          {trip.group.name} · {fullRange(trip)}
        </span>
      </span>
      <span className='flex items-center gap-[10px]'>
        <span className='font-mono text-[11px] text-[#94a3b8]'>{tripWhen(trip, today)}</span>
        <span className={cn("rounded-full border px-[10px] py-1 text-[11px] font-bold", status.pill)}>{status.label}</span>
      </span>
    </Link>
  );
}
