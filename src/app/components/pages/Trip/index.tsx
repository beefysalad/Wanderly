"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Activity, Trip } from "@/src/shared/types";
import { useGroup } from "@/src/hooks/useGroups";
import { useCurrentUserDB } from "@/src/hooks/useProfile";
import { useSocketGroupUpdates } from "@/src/hooks/useSocketGroupUpdates";
import { AppShell } from "../../shared/AppShell/AppShell";
import { StateCard } from "../../shared/AppShell/StateCard";
import LoadingState from "../../shared/LoadingState";
import ConfirmDeleteModal from "../../shared/Modal/ConfirmDeleteModal";
import NavigationLoader from "../../shared/NavigationLoader";
import { blockingQuery } from "../../shared/StateMessage/loadError";
import { TripExportMenu } from "./components/TripExportMenu";
import { TripHero } from "./components/TripHero";
import { TripTabContent } from "./components/TripTabContent";
import { TripTabs } from "./components/TripTabs";
import { useTripActions } from "./useTripActions";
import { useTripTab } from "./useTripTab";

interface ITripComponent {
  tripId: string;
  groupId: string;
}

const resolveDates = (dateInput: Date | string) => {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  return isNaN(d.getTime()) ? null : d;
};

const TripComponent = ({ groupId, tripId }: ITripComponent) => {
  const router = useRouter();
  const groupQuery = useGroup(groupId);
  const { data: groupData, isLoading: loading } = groupQuery;
  const group = groupData?.group || null;
  const trip = group?.trips?.find((t: Trip) => t.id === tripId) || null;
  const [dayIndex, setDayIndex] = useState(0);

  const currentUserId = useCurrentUserDB().data?.id;
  const { activeTab, handleTabChange } = useTripTab(groupId, tripId);
  const actions = useTripActions(groupId, tripId, trip);

  // Enable real-time updates for this group via Socket.IO
  useSocketGroupUpdates(groupId);

  // Mirrors the server: the creator deletes a trip, or the group owner once the creator's account is gone.
  const ownerId = group?.createdByEmail ? group.memberIds?.[group.createdByEmail] : undefined;
  const canDeleteTrip = Boolean(currentUserId && (trip?.createdById ?? ownerId) === currentUserId);

  const handleViewActivity = (activity: Activity) => {
    router.push(`/group/${groupId}/trip/${tripId}/activities/${activity.id}`);
  };

  // Tapping a day in the calendar opens it in the Day tab.
  const pickDay = (tripDay: number) => {
    setDayIndex(tripDay);
    handleTabChange("daily");
  };

  const back = { href: `/group/${groupId}`, crumb: `${group?.name ?? "Group"} · Trips` };

  if (loading) {
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

  if (!trip || !group) {
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

  const startDate = resolveDates(trip.startDate) || new Date();
  const endDate = resolveDates(trip.endDate) || new Date();

  return (
    <AppShell level='detail' back={back}>
      <div className='flex flex-col gap-[18px]'>
        <TripHero
          trip={trip}
          group={group}
          isEditingStatus={actions.isEditingStatus}
          setIsEditingStatus={actions.setIsEditingStatus}
          onStatusChange={actions.handleStatusChange}
          actions={
            <TripExportMenu
              isExporting={actions.isExporting}
              onExport={actions.handleExportSchedule}
              onEdit={() => router.push(`/group/${groupId}/trip/${tripId}/edit`)}
              canDelete={canDeleteTrip}
              onDelete={() => actions.setShowDeleteModal(true)}
            />
          }
        />

        <TripTabs activeTab={activeTab} onChange={handleTabChange} />

        <TripTabContent
          activeTab={activeTab}
          groupId={groupId}
          tripId={tripId}
          startDate={startDate}
          endDate={endDate}
          activities={trip.activities || []}
          dayIndex={dayIndex}
          onPickDay={pickDay}
          updateActivity={actions.handleUpdateActivity}
          toggleDone={actions.handleToggleDone}
          handleViewActivity={handleViewActivity}
        />
      </div>

      {actions.showDeleteModal && (
        <ConfirmDeleteModal
          title='Delete Trip'
          message='Are you sure you want to delete this trip? This action cannot be undone. All activities and expenses associated with this trip will also be deleted.'
          onConfirm={actions.handleDeleteTrip}
          onCancel={() => actions.setShowDeleteModal(false)}
          isDeleting={actions.deleteTripPending}
          confirmText='Delete Trip'
        />
      )}

      {actions.showDeleteActivityModal && (
        <ConfirmDeleteModal
          title='Delete Activity'
          message='Are you sure you want to delete this activity? This action cannot be undone.'
          onConfirm={actions.handleDeleteActivity}
          onCancel={actions.closeDeleteActivityModal}
          isDeleting={actions.isDeletingActivity}
          confirmText='Delete Activity'
        />
      )}

      {actions.isNavigating && <NavigationLoader message='Loading' />}
    </AppShell>
  );
};

export default TripComponent;
