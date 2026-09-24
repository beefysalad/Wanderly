"use client";
import { Activity, Trip } from "@/src/shared/types";
import { useRouter } from "next/navigation";
import { getStatusBadge } from "@/lib/helper";
import { useGroup } from "@/src/hooks/useGroups";
import { useSocketGroupUpdates } from "@/src/hooks/useSocketGroupUpdates";
import PremiumPageHeader from "../../shared/PremiumPageHeader";
import ConfirmDeleteModal from "../../shared/Modal/ConfirmDeleteModal";
import NavigationLoader from "../../shared/NavigationLoader";
import LoadingState from "../../shared/LoadingState";
import { AddFab } from "./components/AddFab";
import { TabSwitcher } from "./components/TabSwitcher";
import { TripActionsMenu } from "./components/TripActionsMenu";
import { TripHeader } from "./components/TripHeader";
import { TripNotFound } from "./components/TripNotFound";
import { TripTabContent } from "./components/TripTabContent";
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

  const currentUserId = useCurrentDbUserId();
  const { activeTab, handleTabChange } = useTripTab(groupId, tripId);
  const actions = useTripActions(groupId, tripId, trip);

  // Enable real-time updates for this group via Socket.IO
  useSocketGroupUpdates(groupId);

  const isTripCreator = Boolean(
    trip?.createdById && currentUserId && trip.createdById === currentUserId,
  );

  /* Navigation Handlers */
  const handleEditActivity = (activity: Activity) => {
    router.push(
      `/group/${groupId}/trip/${tripId}/activities/${activity.id}/edit`,
    );
  };
  const handleViewActivity = (activity: Activity) => {
    // For now, view acts as edit since we want full page experience
    router.push(`/group/${groupId}/trip/${tripId}/activities/${activity.id}`);
  };

  if (loading) {
    return (
      <main className='min-h-screen bg-slate-950 p-6'>
        <LoadingState fullScreen />
      </main>
    );
  }

  if (!trip) {
    return <TripNotFound groupId={groupId} />;
  }

  const startDate = resolveDates(trip.startDate) || new Date();
  const endDate = resolveDates(trip.endDate) || new Date();
  const activities = trip.activities || [];
  const statusBadge = getStatusBadge(trip.status);

  return (
    <main className='min-h-screen bg-slate-950 pb-24 font-sans'>
      <PremiumPageHeader
        title='Trip Details'
        onBack={() => router.push(`/group/${groupId}`)}
        actions={
          <TripActionsMenu
            showExportMenu={actions.showExportMenu}
            setShowExportMenu={actions.setShowExportMenu}
            isExporting={actions.isExporting}
            handleExportSchedule={actions.handleExportSchedule}
            isTripCreator={isTripCreator}
            setShowDeleteModal={actions.setShowDeleteModal}
          />
        }
      />

      <div className='max-w-5xl mx-auto px-4 py-6'>
        <TripHeader
          trip={trip}
          statusBadge={statusBadge}
          startDate={startDate}
          endDate={endDate}
          isEditingStatus={actions.isEditingStatus}
          setIsEditingStatus={actions.setIsEditingStatus}
          handleStatusChange={actions.handleStatusChange}
        />
        <div className='bg-slate-900/60 rounded-2xl border border-white/10 p-4 sm:p-6 min-h-[400px]'>
          <TripTabContent
            activeTab={activeTab}
            groupId={groupId}
            tripId={tripId}
            tripName={trip.name}
            startDate={startDate}
            endDate={endDate}
            activities={activities}
            addActivity={() => {
              // Activity creation happens on the dedicated add page
            }}
            updateActivity={actions.handleUpdateActivity}
            deleteActivity={actions.openDeleteActivityModal}
            toggleDone={actions.handleToggleDone}
            handleEditActivity={handleEditActivity}
            handleViewActivity={handleViewActivity}
          />
        </div>
        <AddFab activeTab={activeTab} groupId={groupId} tripId={tripId} />
      </div>

      <TabSwitcher activeTab={activeTab} handleTabChange={handleTabChange} />

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
    </main>
  );
};

export default TripComponent;
