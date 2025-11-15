"use client";
import { Trip, Activity, Group } from "@/src/shared/types";
import { ArrowLeft, Download, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import BottomNav from "./BottomNav";
import TravelSchedule from "./TravelSchedule";
import TravelCalendar from "./TravelCalendar";
import { getStatusBadge } from "@/lib/helper";
import ActivityModal from "../../shared/Modal/ActivityModal";
import ActivityDetailModal from "../../shared/Modal/ActivityDetailModal";
import ConfirmDeleteModal from "../../shared/Modal/ConfirmDeleteModal";
import { useGroup } from "@/src/hooks/useGroups";
import { useDeleteTrip } from "@/src/hooks/useTrips";
import api from "@/lib/axios";
import { useQueryClient } from "@tanstack/react-query";
import { exportScheduleToPNG } from "@/lib/utils/exportSchedule";

interface ITripComponent {
  tripId: string;
  groupId: string;
}
const TripComponent = ({ groupId, tripId }: ITripComponent) => {
  const router = useRouter();
  const { data: groupData, isLoading: loading } = useGroup(groupId);
  const group = groupData?.group || null;
  const trip = group?.trips?.find((t: Trip) => t.id === tripId) || null;
  const [activeTab, setActiveTab] = useState<"calendar" | "schedule">(
    "calendar"
  );
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
  const deleteTrip = useDeleteTrip(groupId, tripId);
  const queryClient = useQueryClient();

  const handleDeleteTrip = async () => {
    try {
      await deleteTrip.mutateAsync();
      router.push(`/group/${groupId}`);
    } catch (err) {
      setShowDeleteModal(false);
      alert(
        err instanceof Error
          ? err.message
          : "Failed to delete trip. Please try again."
      );
    }
  };

  const handleExportSchedule = async () => {
    if (!trip) return;

    setIsExporting(true);
    try {
      await exportScheduleToPNG({
        trip,
        activities: trip.activities || [],
      });
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

    try {
      await api.delete(`/trips/${tripId}/activities/${activityToDelete}`);
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
      setShowDeleteActivityModal(false);
      setActivityToDelete(null);
    } catch (err) {
      setShowDeleteActivityModal(false);
      setActivityToDelete(null);
      alert(
        err instanceof Error
          ? err.message
          : "Failed to delete activity. Please try again."
      );
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
      <main className='min-h-screen bg-slate-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-12 h-12 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-slate-600'>Loading...</p>
        </div>
      </main>
    );
  }

  if (!trip) {
    return (
      <main className='min-h-screen bg-slate-50 flex items-center justify-center p-4'>
        <div className='text-center'>
          <p className='text-slate-600'>Trip not found</p>
        </div>
      </main>
    );
  }
  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);
  const activities = trip.activities || [];
  const statusBadge = getStatusBadge(trip.status);
  return (
    <main className='min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/40 pb-20'>
      <div className='max-w-2xl mx-auto px-4 py-6'>
        <div className='mb-6'>
          <div className='flex items-center gap-3 mb-4'>
            <button
              onClick={() => router.back()}
              className='p-2.5 hover:bg-white/80 bg-white rounded-xl transition-all shadow-sm hover:shadow-md border border-slate-200'
            >
              <ArrowLeft className='w-5 h-5 text-slate-700' />
            </button>
            <div className='bg-white rounded-2xl shadow-md border border-slate-200 px-6 py-4 flex-1'>
              <div className='flex items-start justify-between gap-3 mb-2'>
                <h1 className='text-2xl font-bold text-slate-900'>
                  {trip.name}
                </h1>
                {!isEditingStatus ? (
                  <button
                    onClick={() => setIsEditingStatus(true)}
                    className={`${statusBadge.bg} ${statusBadge.text} text-xs font-semibold px-3 py-1.5 rounded-full border ${statusBadge.border} hover:opacity-80 transition-opacity`}
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
                    className='text-xs font-semibold px-2 py-1 rounded-full border-2 border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500'
                  >
                    <option value='planning'>Planning</option>
                    <option value='finalized'>Finalized</option>
                    <option value='ongoing'>Ongoing</option>
                    <option value='cancelled'>Cancelled</option>
                  </select>
                )}
              </div>
              <p className='text-sm text-slate-600 flex items-center gap-1.5'>
                <span>📅</span>
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
              </p>
            </div>
          </div>

          <div className='grid grid-cols-2 sm:flex sm:flex-wrap gap-2'>
            <button
              onClick={() => {
                setSelectedDate(null);
                setShowActivityModal(true);
              }}
              className='col-span-2 sm:col-span-1 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white transition-all text-sm font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 active:scale-100'
            >
              <Plus className='w-4 h-4' />
              Add Activity
            </button>

            <button
              onClick={() =>
                router.push(`/group/${groupId}/trip/${tripId}/expenses`)
              }
              className='px-5 py-3 rounded-xl bg-white border-2 border-amber-200 text-slate-700 hover:bg-amber-50 hover:border-amber-300 transition-all text-sm font-medium shadow-sm hover:shadow-md flex items-center justify-center gap-2'
            >
              <span>💰</span> Expenses
            </button>

            {activeTab === "schedule" && (
              <button
                onClick={handleExportSchedule}
                disabled={isExporting || !trip}
                className='px-5 py-3 rounded-xl bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all text-sm font-medium shadow-sm hover:shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                <Download className='w-4 h-4' />
                {isExporting ? "Exporting..." : "Export"}
              </button>
            )}

            <button
              onClick={() => setShowDeleteModal(true)}
              className='px-5 py-3 rounded-xl bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all text-sm font-medium shadow-sm hover:shadow-md flex items-center justify-center gap-2'
            >
              <Trash2 className='w-4 h-4' />
              <span className='hidden sm:inline'>Delete</span>
            </button>
          </div>
        </div>

        <div
          id='schedule-export-container'
          className='bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6'
        >
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

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

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
          isDeleting={false}
          confirmText='Delete Activity'
        />
      )}

      {showActivityDetailModal && selectedActivity && (
        <ActivityDetailModal
          activity={
            trip?.activities?.find((a) => a.id === selectedActivity.id) ||
            selectedActivity
          }
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
        />
      )}
    </main>
  );
};

export default TripComponent;
