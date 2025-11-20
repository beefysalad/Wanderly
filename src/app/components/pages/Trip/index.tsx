"use client";
import { Trip, Activity, Group } from "@/src/shared/types";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import BottomNav from "./BottomNav";
import TravelSchedule from "./TravelSchedule";
import TravelCalendar from "./TravelCalendar";
import { getStatusBadge } from "@/lib/helper";
import ActivityModal from "../../shared/Modal/ActivityModal";
import ActivityDetailModal from "../../shared/Modal/ActivityDetailModal";
import ConfirmDeleteModal from "../../shared/Modal/ConfirmDeleteModal";
import { useGroup } from "@/src/hooks/useGroups";
import { useDeleteTrip } from "@/src/hooks/useTrips";
import { useExpenses } from "@/src/hooks/useExpenses";
import api from "@/lib/axios";
import { useQueryClient } from "@tanstack/react-query";
import {
  exportScheduleToPNG,
  exportScheduleToICS,
} from "@/lib/utils/exportSchedule";
import { ChevronDown } from "lucide-react";
import NavigationLoader from "../../shared/NavigationLoader";
import { useNavigationLoading } from "@/src/hooks/useNavigationLoading";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { useSocketGroupUpdates } from "@/src/hooks/useSocketGroupUpdates";

interface ITripComponent {
  tripId: string;
  groupId: string;
}
const TripComponent = ({ groupId, tripId }: ITripComponent) => {
  const router = useRouter();
  const { data: groupData, isLoading: loading } = useGroup(groupId);
  const { data: expensesData } = useExpenses(tripId);
  const group = groupData?.group || null;
  const trip = group?.trips?.find((t: Trip) => t.id === tripId) || null;
  const expenses = expensesData?.expenses || [];
  const { user: firebaseUser } = useCurrentUser();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "calendar" | "schedule" | "dashboard" | "profile"
  >("calendar");

  // Handle tab changes - navigate for dashboard/profile, switch view for calendar/schedule
  const handleTabChange = (
    tab: "calendar" | "schedule" | "dashboard" | "profile"
  ) => {
    if (tab === "dashboard") {
      router.push("/dashboard");
    } else if (tab === "profile") {
      router.push("/dashboard?tab=profile");
    } else {
      setActiveTab(tab);
    }
  };
  const [showActivityModal, setShowActivityModal] = useState<boolean>(false);
  const [showActivityDetailModal, setShowActivityDetailModal] =
    useState<boolean>(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null
  );
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showDeleteActivityModal, setShowDeleteActivityModal] =
    useState<boolean>(false);
  const [activityToDelete, setActivityToDelete] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isEditingStatus, setIsEditingStatus] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [isDeletingActivity, setIsDeletingActivity] = useState<boolean>(false);
  const deleteTrip = useDeleteTrip(groupId, tripId);
  const queryClient = useQueryClient();
  const { isNavigating, withNavigation } = useNavigationLoading();

  // Enable real-time updates for this group via Socket.IO
  useSocketGroupUpdates(groupId);

  // Fetch current user's database ID
  useEffect(() => {
    if (firebaseUser) {
      api
        .get("/sync")
        .then((res) => {
          if (res.data?.user?.id) {
            setCurrentUserId(res.data.user.id);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch user ID:", err);
        });
    }
  }, [firebaseUser]);

  // Check if current user is the trip creator
  const isTripCreator =
    trip?.createdById && currentUserId && trip.createdById === currentUserId;

  const handleDeleteTrip = async () => {
    try {
      await withNavigation(async () => {
        await deleteTrip.mutateAsync();
        router.push(`/group/${groupId}`);
      });
    } catch (err) {
      setShowDeleteModal(false);
      alert(
        err instanceof Error
          ? err.message
          : "Failed to delete trip. Please try again."
      );
    }
  };

  const handleExportSchedule = async (format: "png" | "ics") => {
    if (!trip) return;

    setIsExporting(true);
    setShowExportMenu(false);
    try {
      if (format === "png") {
        await exportScheduleToPNG({
          trip,
          activities: trip.activities || [],
        });
      } else {
        await exportScheduleToICS({
          trip,
          activities: trip.activities || [],
        });
      }
    } catch (error) {
      console.error("Failed to export schedule:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to export schedule. Please try again."
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleUpdateActivity = async (
    id: string,
    updates: Partial<Activity>
  ) => {
    try {
      await api.patch(`/trips/${tripId}/activities/${id}`, updates);
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Failed to update activity. Please try again."
      );
    }
  };

  const handleDeleteActivity = async () => {
    if (!activityToDelete) return;

    setIsDeletingActivity(true);
    try {
      await api.delete(`/trips/${tripId}/activities/${activityToDelete}`);
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
      setShowDeleteActivityModal(false);
      setActivityToDelete(null);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Failed to delete activity. Please try again."
      );
    } finally {
      setIsDeletingActivity(false);
    }
  };

  const openDeleteActivityModal = (id: string) => {
    setActivityToDelete(id);
    setShowDeleteActivityModal(true);
  };

  const handleToggleDone = async (id: string) => {
    if (!trip) return;
    const activity = trip.activities?.find((a) => a.id === id);
    if (!activity) return;

    const newDoneState = !activity.done;
    const previousState = activity.done;

    // Optimistically update the cache immediately
    queryClient.setQueryData<{ group: Group }>(["groups", groupId], (old) => {
      if (!old) return old;
      return {
        group: {
          ...old.group,
          trips: old.group.trips?.map((t) => {
            if (t.id !== tripId) return t;
            return {
              ...t,
              activities: t.activities?.map((a) =>
                a.id === id ? { ...a, done: newDoneState } : a
              ),
            };
          }),
        },
      };
    });

    try {
      await api.patch(`/trips/${tripId}/activities/${id}`, {
        done: newDoneState,
      });
      // Silently refetch in the background to sync with server
      queryClient.refetchQueries({
        queryKey: ["groups", groupId],
        type: "active",
      });
    } catch (err) {
      // Revert optimistic update on error
      queryClient.setQueryData<{ group: Group }>(["groups", groupId], (old) => {
        if (!old) return old;
        return {
          group: {
            ...old.group,
            trips: old.group.trips?.map((t) => {
              if (t.id !== tripId) return t;
              return {
                ...t,
                activities: t.activities?.map((a) =>
                  a.id === id ? { ...a, done: previousState } : a
                ),
              };
            }),
          },
        };
      });
      alert(
        err instanceof Error
          ? err.message
          : "Failed to update activity. Please try again."
      );
    }
  };

  const addActivity = () => {
    // Activity creation is handled by ActivityModal
  };
  const updateActivity = (id: string, updates: Partial<Activity>) => {
    handleUpdateActivity(id, updates);
  };
  const deleteActivity = (id: string) => {
    openDeleteActivityModal(id);
  };
  const toggleDone = (id: string) => {
    handleToggleDone(id);
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setShowActivityDetailModal(false);
    setShowActivityModal(true);
  };

  const handleViewActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    setShowActivityDetailModal(true);
  };
  const handleStatusChange = async (
    newStatus: "planning" | "finalized" | "ongoing" | "cancelled"
  ) => {
    if (!trip) return;

    const previousStatus = trip.status || "planning";

    // Optimistically update the cache
    queryClient.setQueryData<{ group: Group }>(["groups", groupId], (old) => {
      if (!old) return old;
      return {
        group: {
          ...old.group,
          trips: old.group.trips?.map((t) => {
            if (t.id !== tripId) return t;
            return {
              ...t,
              status: newStatus,
            };
          }),
        },
      };
    });

    setIsEditingStatus(false);

    try {
      await api.patch(`/groups/${groupId}/trips/${tripId}`, {
        status: newStatus,
      });
      // Silently refetch in the background to sync with server
      queryClient.refetchQueries({
        queryKey: ["groups", groupId],
        type: "active",
      });
    } catch (err) {
      // Revert optimistic update on error
      queryClient.setQueryData<{ group: Group }>(["groups", groupId], (old) => {
        if (!old) return old;
        return {
          group: {
            ...old.group,
            trips: old.group.trips?.map((t) => {
              if (t.id !== tripId) return t;
              return {
                ...t,
                status: previousStatus,
              };
            }),
          },
        };
      });
      setIsEditingStatus(true); // Keep editing mode open on error
      alert(
        err instanceof Error
          ? err.message
          : "Failed to update trip status. Please try again."
      );
    }
  };

  if (loading) {
    return (
      <main className='min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/40 to-amber-50/50 flex items-center justify-center'>
        <div className='text-center bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 p-8'>
          <div className='w-12 h-12 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-slate-700 font-medium'>Loading trip...</p>
        </div>
      </main>
    );
  }

  if (!trip) {
    return (
      <main className='min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/40 to-amber-50/50 flex items-center justify-center p-4'>
        <div className='text-center bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 p-8 max-w-md'>
          <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <span className='text-3xl'>😞</span>
          </div>
          <h2 className='text-xl font-bold text-slate-900 mb-2'>
            Trip Not Found
          </h2>
          <p className='text-slate-600 mb-6'>
            This trip doesn&apos;t exist or has been removed.
          </p>
          <button
            onClick={() => router.push(`/group/${groupId}`)}
            className='px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl transition-all font-semibold shadow-md hover:shadow-lg'
          >
            Go Back to Group
          </button>
        </div>
      </main>
    );
  }
  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);
  const activities = trip.activities || [];
  const statusBadge = getStatusBadge(trip.status);
  return (
    <main className='min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/40 to-amber-50/50 pb-32 md:pb-24'>
      <div className='max-w-4xl mx-auto px-4 py-6'>
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className='mb-6 px-4 py-2 rounded-lg cursor-pointer transition-all flex items-center gap-2 font-medium text-slate-700 hover:text-slate-900 hover:bg-white/60 backdrop-blur-sm'
          aria-label='Go back'
        >
          <ArrowLeft className='w-5 h-5' />
          Back
        </button>

        {/* Content wrapper to match calendar cards alignment */}
        <div className='p-4 sm:p-6'>
          {/* Trip Header Info */}
          <div className='mb-6'>
            <div className='flex items-start justify-between gap-4 mb-3'>
              <h1 className='text-3xl sm:text-4xl font-bold text-slate-900 leading-tight'>
                {trip.name}
              </h1>
            </div>

            {/* Status Badge */}
            <div className='mb-3'>
              {!isEditingStatus ? (
                <button
                  onClick={() => setIsEditingStatus(true)}
                  className={`${statusBadge.bg} ${statusBadge.text} text-xs font-semibold px-4 py-2 rounded-full border ${statusBadge.border} hover:opacity-90 transition-opacity shadow-sm inline-flex items-center`}
                >
                  {statusBadge.label}
                </button>
              ) : (
                <select
                  value={trip.status || "planning"}
                  onChange={(e) =>
                    handleStatusChange(
                      e.target.value as
                        | "planning"
                        | "finalized"
                        | "ongoing"
                        | "cancelled"
                    )
                  }
                  onBlur={() => setIsEditingStatus(false)}
                  autoFocus
                  className='text-xs font-semibold px-3 py-2 rounded-full border-2 border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white shadow-sm'
                >
                  <option value='planning'>Planning</option>
                  <option value='finalized'>Finalized</option>
                  <option value='ongoing'>Ongoing</option>
                  <option value='cancelled'>Cancelled</option>
                </select>
              )}
            </div>

            <p className='text-sm sm:text-base text-slate-600 flex items-center gap-2 mb-2'>
              <span className='text-lg'>📅</span>
              <span>
                {startDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}{" "}
                -{" "}
                {endDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </p>
            {trip.createdBy && (
              <p className='text-xs text-slate-600 flex items-center gap-1.5'>
                <span>Trip created by {trip.createdBy}</span>
              </p>
            )}
          </div>

          {/* Action Buttons Group - Modern Redesign */}
          <div className='mb-6'>
            <div className='flex flex-col sm:flex-row gap-3'>
              {/* Primary Action Button */}
              <button
                onClick={() => {
                  setSelectedDate(null);
                  setShowActivityModal(true);
                }}
                className='w-full sm:w-auto sm:flex-initial px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white transition-all duration-200 font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transform'
              >
                <Plus className='w-5 h-5' />
                <span>Add Activity</span>
              </button>

              {/* Secondary Action Buttons - Consistent Sizing */}
              <div className='flex gap-3 w-full sm:w-auto'>
                {/* Expenses Button */}
                <button
                  onClick={() =>
                    router.push(`/group/${groupId}/trip/${tripId}/expenses`)
                  }
                  className='flex-1 sm:flex-initial min-w-0 px-4 py-3 rounded-xl bg-white/90 backdrop-blur-sm hover:bg-white text-slate-700 border border-slate-200/50 hover:border-slate-300 transition-all duration-200 font-medium shadow-sm hover:shadow-md flex items-center justify-center gap-2 active:scale-[0.98]'
                >
                  <span className='text-lg flex-shrink-0'>💰</span>
                  <span className='hidden sm:inline truncate'>Expenses</span>
                </button>

                {/* Export Button with Dropdown */}
                {activeTab === "schedule" && (
                  <div className='relative flex-1 sm:flex-initial min-w-0'>
                    <button
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      disabled={isExporting || !trip}
                      className='w-full min-w-0 px-4 py-3 rounded-xl bg-white/90 backdrop-blur-sm hover:bg-white text-slate-700 border border-slate-200/50 hover:border-slate-300 transition-all duration-200 font-medium shadow-sm hover:shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]'
                    >
                      <span className='hidden sm:inline truncate'>
                        {isExporting ? "Exporting..." : "Export"}
                      </span>
                      <span className='sm:hidden truncate'>
                        {isExporting ? "..." : "Export"}
                      </span>
                      <ChevronDown className='w-4 h-4 flex-shrink-0' />
                    </button>
                    {showExportMenu && (
                      <>
                        <div
                          className='fixed inset-0 z-10'
                          onClick={() => setShowExportMenu(false)}
                        />
                        <div className='absolute top-full right-0 mt-2 w-48 sm:w-56 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-20'>
                          <button
                            onClick={() => {
                              handleExportSchedule("png");
                              setShowExportMenu(false);
                            }}
                            disabled={isExporting}
                            className='w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed'
                          >
                            <span className='text-slate-700 font-medium text-sm'>
                              Export as PNG
                            </span>
                          </button>
                          <button
                            onClick={() => {
                              handleExportSchedule("ics");
                              setShowExportMenu(false);
                            }}
                            disabled={isExporting}
                            className='w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed border-t border-slate-100'
                          >
                            <span className='text-slate-700 font-medium text-sm'>
                              Export as Calendar (.ics)
                            </span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Delete Button */}
                {isTripCreator && (
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className='flex-1 sm:flex-initial min-w-0 px-4 py-3 rounded-xl bg-white/90 backdrop-blur-sm hover:bg-red-50 text-red-600 border border-red-200/50 hover:border-red-300 transition-all duration-200 font-medium shadow-sm hover:shadow-md flex items-center justify-center gap-2 active:scale-[0.98]'
                  >
                    <Trash2 className='w-4 h-4 flex-shrink-0' />
                    <span className='hidden sm:inline truncate'>Delete</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Area Card */}
        <div
          id='schedule-export-container'
          className='p-4 sm:p-6 relative overflow-hidden'
        >
          <div className='relative z-10'>
            {activeTab === "calendar" ? (
              <TravelCalendar
                startDate={startDate}
                endDate={endDate}
                activities={activities}
                onAddActivity={addActivity}
                onUpdateActivity={updateActivity}
                onDeleteActivity={deleteActivity}
                onToggleDone={toggleDone}
                onEditActivity={handleEditActivity}
                onViewActivity={handleViewActivity}
                onOpenAddModal={(date) => {
                  setSelectedDate(date);
                  setEditingActivity(null);
                  setShowActivityModal(true);
                }}
              />
            ) : (
              <TravelSchedule
                startDate={startDate}
                endDate={endDate}
                activities={activities}
                onAddActivity={addActivity}
                onUpdateActivity={updateActivity}
                onDeleteActivity={deleteActivity}
                onToggleDone={toggleDone}
                onEditActivity={handleEditActivity}
                onViewActivity={handleViewActivity}
                tripName={trip.name}
              />
            )}
          </div>
        </div>
      </div>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      {showActivityModal && (
        <ActivityModal
          tripId={tripId}
          groupId={groupId}
          startDate={startDate}
          endDate={endDate}
          preSelectedDate={selectedDate}
          isDateLocked={selectedDate !== null}
          editingActivity={editingActivity}
          onClose={() => {
            setShowActivityModal(false);
            setSelectedDate(null);
            setEditingActivity(null);
          }}
        />
      )}

      {showDeleteModal && (
        <ConfirmDeleteModal
          title='Delete Trip'
          message='Are you sure you want to delete this trip? This action cannot be undone. All activities and expenses associated with this trip will also be deleted.'
          onConfirm={handleDeleteTrip}
          onCancel={() => setShowDeleteModal(false)}
          isDeleting={deleteTrip.isPending}
          confirmText='Delete Trip'
        />
      )}

      {showDeleteActivityModal && (
        <ConfirmDeleteModal
          title='Delete Activity'
          message='Are you sure you want to delete this activity? This action cannot be undone.'
          onConfirm={handleDeleteActivity}
          onCancel={() => {
            setShowDeleteActivityModal(false);
            setActivityToDelete(null);
          }}
          isDeleting={isDeletingActivity}
          confirmText='Delete Activity'
        />
      )}

      {showActivityDetailModal && selectedActivity && (
        <ActivityDetailModal
          activity={
            trip?.activities?.find((a) => a.id === selectedActivity.id) ||
            selectedActivity
          }
          expenses={expenses}
          tripId={tripId}
          onClose={() => {
            setShowActivityDetailModal(false);
            setSelectedActivity(null);
          }}
          onEdit={() => handleEditActivity(selectedActivity)}
          onDelete={() => {
            setShowActivityDetailModal(false);
            openDeleteActivityModal(selectedActivity.id);
          }}
          onToggleDone={() => {
            toggleDone(selectedActivity.id);
            // Update the selected activity state optimistically
            setSelectedActivity({
              ...selectedActivity,
              done: !selectedActivity.done,
            });
          }}
          onSelectExpense={(expense) => {
            router.push(`/group/${groupId}/trip/${tripId}/expenses`);
          }}
        />
      )}

      {isNavigating && <NavigationLoader message='Redirecting...' />}
    </main>
  );
};

export default TripComponent;
