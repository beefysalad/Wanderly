"use client";

import Link from "next/link";
import { formatPeso } from "@/lib/utils/money";
import { calculateUnsettledStats, partitionExpenses } from "@/src/app/components/pages/Expenses/expenseStats";
import { useExpenses } from "@/src/hooks/useExpenses";
import { AvatarStack } from "../../shared/UserAvatar";
import { useShellUser } from "../../shared/AppShell/useShellUser";
import { shortRange, tripCountdown, tripMeta, type TripWithGroup } from "../../shared/tripDates";
import { groupPeople } from "./groupPeople";

const TILE = "flex flex-col gap-1 rounded-2xl border p-[14px]";

/** The trip that is on now or next, with a countdown, its dates and your running tab. */
export function NextTripCard({ trip, today }: { trip: TripWithGroup; today: Date }) {
  const { email } = useShellUser();
  const { data } = useExpenses(trip.id);
  const countdown = tripCountdown(trip, today);

  const expenses = data?.expenses;
  const total = expenses?.reduce((sum, expense) => sum + expense.amount, 0) ?? 0;
  const youOwe = expenses
    ? calculateUnsettledStats(partitionExpenses(expenses, email).unsettled, email).youOwe
    : null;

  return (
    <Link
      href={`/group/${trip.groupId}/trip/${trip.id}`}
      className='block overflow-hidden rounded-[26px] border border-white/[.09] bg-[linear-gradient(180deg,rgba(15,23,42,.92),rgba(2,6,23,.92))] text-inherit shadow-[0_60px_120px_-50px_rgba(0,0,0,.9)] transition-[border-color] hover:border-white/[.18]'
    >
      <div className='flex items-center justify-between gap-[14px] border-b border-white/[.06] px-[18px] py-4'>
        <div className='min-w-0'>
          <p className='truncate font-mono text-[10px] uppercase tracking-[.18em] text-[#64748b]'>
            Next trip · {trip.group.name}
          </p>
          <p className='mt-1 truncate text-2xl font-extrabold tracking-[-.02em]'>{trip.name}</p>
        </div>
        <AvatarStack people={groupPeople(trip.group)} />
      </div>

      <div className='grid grid-cols-[repeat(auto-fit,minmax(min(170px,100%),1fr))] gap-[10px] p-[14px]'>
        <div className={`${TILE} border-white/[.05] bg-[rgba(30,41,59,.4)]`}>
          <span className='text-[11px] text-[#94a3b8]'>Countdown</span>
          <span className='text-[30px] font-extrabold tracking-[-.02em] tabular-nums'>
            {countdown.big}
            <span className='text-sm font-semibold text-[#94a3b8]'>{countdown.small}</span>
          </span>
        </div>
        <div className={`${TILE} border-white/[.05] bg-[rgba(30,41,59,.4)]`}>
          <span className='truncate text-[11px] text-[#94a3b8]'>{trip.location || "Trip dates"}</span>
          <span className='text-lg font-bold'>{shortRange(trip)}</span>
          <span className='font-mono text-[11px] text-[#64748b]'>{tripMeta(trip)}</span>
        </div>
        <div className={`${TILE} border-[rgba(245,158,11,.22)] bg-[rgba(245,158,11,.07)]`}>
          <span className='font-mono text-[10px] uppercase tracking-[.16em] text-[#fcd34d]'>Running tab</span>
          <span className='text-2xl font-extrabold tabular-nums text-[#fb923c]'>
            {youOwe === null ? "—" : formatPeso(youOwe)}
          </span>
          <span className='text-[11px] text-[#94a3b8]'>you owe · {formatPeso(total)} trip total</span>
        </div>
      </div>
    </Link>
  );
}
