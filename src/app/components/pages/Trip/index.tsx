"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Activity, Trip } from "@/src/shared/types";
import { useGroup } from "@/src/hooks/useGroups";
import { useSocketGroupUpdates } from "@/src/hooks/useSocketGroupUpdates";
import { AppShell } from "../../shared/AppShell/AppShell";
import LoadingState from "../../shared/LoadingState";
import ConfirmDeleteModal from "../../shared/Modal/ConfirmDeleteModal";
import NavigationLoader from "../../shared/NavigationLoader";
import { TripExportMenu } from "./components/TripExportMenu";
import { TripHero } from "./components/TripHero";
import { TripNotFound } from "./components/TripNotFound";
import { TripTabContent } from "./components/TripTabContent";
import { TripTabs } from "./components/TripTabs";
import { useCurrentDbUserId } from "./useCurrentDbUserId";
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
  const { data: groupData, isLoading: loading } = useGroup(groupId);
  const group = groupData?.group || null;
  const trip = group?.trips?.find((t: Trip) => t.id === tripId) || null;
  const [dayIndex, setDayIndex] = useState(0);

  const currentUserId = useCurrentDbUserId();
  const { activeTab, handleTabChange } = useTripTab(groupId, tripId);
  const actions = useTripActions(groupId, tripId, trip);

  // Enable real-time updates for this group via Socket.IO
  useSocketGroupUpdates(groupId);

  const isTripCreator = Boolean(trip?.createdById && currentUserId && trip.createdById === currentUserId);

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

  if (!trip || !group) {
    return <TripNotFound groupId={groupId} />;
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
              isTripCreator={isTripCreator}
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
