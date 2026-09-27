"use client";

import { getVibeInfo } from "@/lib/utils/groupColors";
import { useRouter } from "next/navigation";
import { useGroup } from "@/src/hooks/useGroups";
import { AppShell } from "../../shared/AppShell/AppShell";
import { StateCard } from "../../shared/AppShell/StateCard";
import LoadingState from "../../shared/LoadingState";
import { blockingQuery } from "../../shared/StateMessage/loadError";
import { EditTripForm } from "./EditTripForm";

interface EditTripProps {
  groupId: string;
  tripId: string;
}

/** Edit a trip's name, location and dates. Any member of the group can. */
export default function EditTrip({ groupId, tripId }: EditTripProps) {
  const router = useRouter();
  const groupQuery = useGroup(groupId);
  const { data, isLoading } = groupQuery;
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

  const failed = blockingQuery(groupQuery);
  if (failed) {
    return <StateCard back={back} variant='error' query={failed} what='this trip' />;
  }

  if (!group || !trip) {
    return (
      <StateCard
        back={back}
        title='Trip not found'
        body="This trip doesn't exist or has been removed."
        actionLabel='Go back to group'
        onAction={() => router.push(`/group/${groupId}`)}
      />
    );
  }

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
