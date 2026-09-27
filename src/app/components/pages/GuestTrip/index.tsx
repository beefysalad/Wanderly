"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useGroupAsGuest } from "@/src/hooks/useGroups";
import { useSocketGroupUpdates } from "@/src/hooks/useSocketGroupUpdates";
import type { Activity, Trip } from "@/src/shared/types";
import { GuestShell } from "../../shared/AppShell/GuestShell";
import LoadingState from "../../shared/LoadingState";
import { StateMessage } from "../../shared/StateMessage";
import { blockingQuery } from "../../shared/StateMessage/loadError";
import { TripHero } from "../Trip/components/TripHero";
import { TripTabContent } from "../Trip/components/TripTabContent";
import { TripTabs } from "../Trip/components/TripTabs";
import { parseTabParam, type TabType } from "../Trip/tripTabs";

interface IGuestTripComponent {
  tripId: string;
  groupId: string;
}

const GUEST_TABS: TabType[] = ["daily", "schedule", "calendar", "expenses"];

const GuestTripComponent = ({ groupId, tripId }: IGuestTripComponent) => {
  const router = useRouter();
  const groupQuery = useGroupAsGuest(groupId);
  const { data: group, isLoading: loading } = groupQuery;
  const trip = group?.trips?.find((t: Trip) => t.id === tripId) || null;
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const tab = parseTabParam(searchParams.get("tab"));
    return tab && GUEST_TABS.includes(tab) ? tab : "daily";
  });
  const [dayIndex, setDayIndex] = useState(0);

  // Enable real-time updates for this group via Socket.IO
  useSocketGroupUpdates(groupId);

  const back = { href: `/guest/group/${groupId}`, crumb: `${group?.name ?? "Group"} · Trips` };

  if (loading) {
    return (
      <GuestShell group={group} back={back}>
        <LoadingState className='py-24' />
      </GuestShell>
    );
  }

  const failed = blockingQuery(groupQuery);
  if (failed) {
    return (
      <GuestShell group={group} back={back}>
        <StateMessage variant='error' query={failed} what='this trip' signInHref='/guest/join' />
      </GuestShell>
    );
  }

  if (!trip || !group) {
    return (
      <GuestShell group={group} back={back}>
        <StateMessage
          title='Trip not found'
          body="This trip doesn't exist or has been removed."
          actionLabel='Back to the group'
          onAction={() => router.push(`/guest/group/${groupId}`)}
        />
      </GuestShell>
    );
  }

  const handleViewActivity = (activity: Activity) => {
    router.push(`/guest/group/${groupId}/trip/${tripId}/activities/${activity.id}`);
  };

  return (
    <GuestShell group={group} back={back}>
      <div className='flex flex-col gap-[18px]'>
        <TripHero trip={trip} group={group} />
        <TripTabs activeTab={activeTab} onChange={setActiveTab} tabs={GUEST_TABS} />
        <TripTabContent
          activeTab={activeTab}
          groupId={groupId}
          tripId={tripId}
          startDate={new Date(trip.startDate)}
          endDate={new Date(trip.endDate)}
          activities={trip.activities || []}
          dayIndex={dayIndex}
          onPickDay={(day) => {
            setDayIndex(day);
            setActiveTab("daily");
          }}
          handleViewActivity={handleViewActivity}
          guest
        />
      </div>
    </GuestShell>
  );
};

export default GuestTripComponent;
