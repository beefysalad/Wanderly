"use client";

import { getVibeInfo } from "@/lib/utils/groupColors";
import { useGroup } from "@/src/hooks/useGroups";
import { AppShell } from "../../shared/AppShell/AppShell";
import { StateCard } from "../../shared/AppShell/StateCard";
import LoadingState from "../../shared/LoadingState";
import { TripNotFound } from "../Trip/components/TripNotFound";
import { EditTripForm } from "./EditTripForm";

interface EditTripProps {
  groupId: string;
  tripId: string;
}

/** Edit a trip's name, location and dates. Any member of the group can. */
export default function EditTrip({ groupId, tripId }: EditTripProps) {
  const { data, isLoading, isError } = useGroup(groupId);
  const group = data?.group;
  const trip = group?.trips?.find((t) => t.id === tripId);
  const back = { href: `/group/${groupId}/trip/${tripId}`, crumb: `${trip?.name ?? "Trip"} · Edit` };

  if (isLoading) {
    return (
      <AppShell level='detail' back={back}>
        <LoadingState className='py-24' />
      </AppShell>
    );
  }

  if (isError) {
    return <StateCard back={back} title="Couldn't load this trip" body='Check your connection and try again.' />;
  }

  if (!group || !trip) return <TripNotFound groupId={groupId} />;

  return (
    <AppShell level='detail' back={back}>
      <div className='flex max-w-[600px] flex-col gap-[22px]'>
        <div>
          <p className='mb-2 font-mono text-[10px] uppercase tracking-[.16em] text-[#64748b]'>
            {group.emoji || getVibeInfo(group.colorScheme).emoji} {group.name}
          </p>
          <h1 className='text-[clamp(28px,4.4cqw,40px)] font-extrabold leading-[1.05] tracking-[-.03em]'>Edit trip</h1>
        </div>
        <EditTripForm groupId={groupId} trip={trip} />
      </div>
    </AppShell>
  );
}
