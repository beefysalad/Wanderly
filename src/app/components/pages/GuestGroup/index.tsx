"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/utils/clipboard";
import { useGroupAsGuest } from "@/src/hooks/useGroups";
import { useSocketGroupUpdates } from "@/src/hooks/useSocketGroupUpdates";
import { GuestShell } from "../../shared/AppShell/GuestShell";
import LoadingState from "../../shared/LoadingState";
import { PILL } from "../../shared/Pills";
import { allTrips, upcomingTrips } from "../../shared/tripDates";
import { GroupHero } from "../Group/GroupHero";
import { GroupTrips } from "../Group/GroupTrips";

interface IGuestGroupComponent {
  groupId: string;
}

const GuestGroupComponent = ({ groupId }: IGuestGroupComponent) => {
  const router = useRouter();
  const { data: group, isLoading, error } = useGroupAsGuest(groupId);
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

  if (!group || error) {
    return (
      <GuestShell>
        <div className='mx-auto max-w-md rounded-[22px] border border-white/[.08] bg-[rgba(15,23,42,.6)] p-10 text-center'>
          <h2 className='mb-2 text-xl font-bold'>Group not found</h2>
          <p className='mb-6 text-[#94a3b8]'>This group doesn&apos;t exist or has been removed.</p>
          <button type='button' onClick={() => router.push("/")} className={PILL.ghost}>
            Go home
          </button>
        </div>
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
