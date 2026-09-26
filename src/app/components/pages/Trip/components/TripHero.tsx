import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { getVibeInfo } from "@/lib/utils/groupColors";
import { getTripStatus, type TripStatus } from "@/lib/utils/tripStatus";
import type { Group, Trip } from "@/src/shared/types";
import { AvatarStack } from "../../../shared/UserAvatar";
import { fullRange } from "../../../shared/tripDates";
import { groupPeople } from "../../Dashboard/groupPeople";
import type { ReactNode } from "react";

const STATUS_OPTIONS: TripStatus[] = ["planning", "finalized", "ongoing", "cancelled"];

interface TripHeroProps {
  trip: Trip;
  group: Group;
  /** Leave the three status props out for a read-only viewer; the status is then a plain pill. */
  isEditingStatus?: boolean;
  setIsEditingStatus?: (value: boolean) => void;
  onStatusChange?: (status: TripStatus) => void;
  /** The Export pill. */
  actions?: ReactNode;
}

/** Group and place in mono, the trip name, its status, dates and creator, and who's coming. */
export function TripHero({ trip, group, isEditingStatus, setIsEditingStatus, onStatusChange, actions }: TripHeroProps) {
  const status = getTripStatus(trip.status);
  const place = [group.emoji || getVibeInfo(group.colorScheme).emoji, group.name, trip.location].filter(Boolean);

  return (
    <div className='flex flex-wrap items-end justify-between gap-[18px]'>
      <div className='min-w-0'>
        <p className='mb-2 truncate font-mono text-[10px] uppercase tracking-[.16em] text-[#64748b]'>
          {place[0]} {place.slice(1).join(" · ")}
        </p>
        <h1 className='mb-3 text-[clamp(32px,4.6cqw,48px)] font-extrabold leading-none tracking-[-.035em] [overflow-wrap:anywhere]'>
          {trip.name}
        </h1>
        <div className='flex flex-wrap items-center gap-x-[14px] gap-y-2 text-[13px] text-[#94a3b8]'>
          {isEditingStatus && onStatusChange ? (
            <select
              value={status.key}
              autoFocus
              onChange={(event) => onStatusChange(event.target.value as TripStatus)}
              onBlur={() => setIsEditingStatus?.(false)}
              className='cursor-pointer rounded-full border border-white/[.14] bg-[#0f172a] px-[10px] py-1 text-[11px] font-bold text-[#e2e8f0] focus:outline-none'
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {getTripStatus(option).label}
                </option>
              ))}
            </select>
          ) : onStatusChange && setIsEditingStatus ? (
            <button
              type='button'
              title='Change status'
              onClick={() => setIsEditingStatus(true)}
              className={cn("cursor-pointer rounded-full border px-[10px] py-1 text-[11px] font-bold", status.pill)}
            >
              {status.label}
            </button>
          ) : (
            <span className={cn("rounded-full border px-[10px] py-1 text-[11px] font-bold", status.pill)}>{status.label}</span>
          )}
          <span className='flex items-center gap-[6px]'>
            <Calendar className='size-[14px]' />
            {fullRange(trip)}
          </span>
          {trip.createdBy ? <span>by {trip.createdBy}</span> : null}
        </div>
      </div>
      <div className='flex items-center gap-3'>
        <AvatarStack people={groupPeople(group)} sizeClass='size-[30px] text-[10px]' />
        {actions}
      </div>
    </div>
  );
}
