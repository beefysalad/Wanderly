"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";
import { copyToClipboard } from "@/src/lib/utils/clipboard";
import { useGroupAsGuest } from "@/src/hooks/useGroups";
import { useSocketGroupUpdates } from "@/src/hooks/useSocketGroupUpdates";
import { GuestShell } from "../../shared/AppShell/GuestShell";
import LoadingState from "../../shared/LoadingState";
import { StateMessage } from "../../shared/StateMessage";
import { blockingQuery } from "../../shared/StateMessage/loadError";
import { allTrips, upcomingTrips } from "../../shared/tripDates";
import { GroupHero } from "../Group/GroupHero";
import { GroupTrips } from "../Group/GroupTrips";

interface IGuestGroupComponent {
  groupId: string;
}

const GuestGroupComponent = ({ groupId }: IGuestGroupComponent) => {
  const router = useRouter();
  const groupQuery = useGroupAsGuest(groupId);
  const { data: group, isLoading } = groupQuery;
  const today = useMemo(() => new Date(), []);

  // Enable real-time updates for this group via Socket.IO
  useSocketGroupUpdates(groupId);

  const copyCode = async () => {
    if (!group) return;
    if (await copyToClipboard(group.code)) toast.success("Group code copied to clipboard!");
    else toast.error("Failed to copy group code");
  };

  if (isLoading) {
    return (
      <GuestShell>
        <LoadingState className='py-24' />
      </GuestShell>
    );
  }

  const failed = blockingQuery(groupQuery);
  if (failed) {
    return (
      <GuestShell>
        <StateMessage variant='error' query={failed} what='this group' signInHref='/guest/join' />
      </GuestShell>
    );
  }

  if (!group) {
    return (
      <GuestShell>
        <StateMessage
          title='Group not found'
          body="This group doesn't exist or has been removed."
          actionLabel='Go home'
          onAction={() => router.push("/")}
        />
      </GuestShell>
    );
  }

  return (
    <GuestShell group={group}>
      <div className='flex flex-col gap-6'>
        <GroupHero
          group={group}
          upcomingCount={upcomingTrips(allTrips([group]), today).length}
          membersHref={`/guest/group/${group.id}/members`}
          onCopyCode={copyCode}
        />
        <GroupTrips
          trips={group.trips ?? []}
          today={today}
          tripHref={(tripId) => `/guest/group/${group.id}/trip/${tripId}`}
        />
      </div>
    </GuestShell>
  );
};

export default GuestGroupComponent;
