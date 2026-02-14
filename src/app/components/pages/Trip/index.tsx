"use client";
import { Trip, Activity, Group } from "@/src/shared/types";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  List,
  DollarSign,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
// BottomNav import removed
import TravelSchedule from "./TravelSchedule";
import TravelCalendar from "./TravelCalendar";
import ExpensesComponent from "../Expenses";
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

type TabType = "calendar" | "schedule" | "expenses";

const TripComponent = ({ groupId, tripId }: ITripComponent) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: groupData, isLoading: loading } = useGroup(groupId);
  const { data: expensesData } = useExpenses(tripId);
  const group = groupData?.group || null;
  const trip = group?.trips?.find((t: Trip) => t.id === tripId) || null;
  const expenses = expensesData?.expenses || [];
  const { user: firebaseUser } = useCurrentUser();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("schedule");

  const [showActivityModal, setShowActivityModal] = useState<boolean>(false);
  const [showActivityDetailModal, setShowActivityDetailModal] =
    useState<boolean>(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null,
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

  // Sync active tab with URL search params
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "expenses" || tab === "calendar" || tab === "schedule") {
      setActiveTab(tab as TabType);
    }
  }, [searchParams]);

  // Update URL when tab changes (optional, but good for bookmarking)
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    // Use replace to prevent history stack buildup for every tab click
    // or push to allow back button navigation
    router.replace(`/group/${groupId}/trip/${tripId}?tab=${tab}`, {
      scroll: false,
    });
  };

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
          : "Failed to delete trip. Please try again.",
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
          : "Failed to export schedule. Please try again.",
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleUpdateActivity = async (
    id: string,
    updates: Partial<Activity>,
  ) => {
    try {
      await api.patch(`/trips/${tripId}/activities/${id}`, updates);
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Failed to update activity. Please try again.",
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
          : "Failed to delete activity. Please try again.",
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
                a.id === id ? { ...a, done: newDoneState } : a,
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
                  a.id === id ? { ...a, done: previousState } : a,
                ),
              };
            }),
          },
        };
      });
      alert(
        err instanceof Error
          ? err.message
          : "Failed to update activity. Please try again.",
      );
    }
  };

  const resolveDates = (dateInput: Date | string) => {
    if (!dateInput) return null;
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? null : d;
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

  /* Navigation Handlers */
  const handleEditActivity = (activity: Activity) => {
    router.push(
      `/group/${groupId}/trip/${tripId}/activities/${activity.id}/edit`,
    );
  };
  const handleViewActivity = (activity: Activity) => {
    // For now, view acts as edit since we want full page experience
    router.push(
      `/group/${groupId}/trip/${tripId}/activities/${activity.id}/edit`,
    );
  };
  const handleStatusChange = async (
    newStatus: "planning" | "finalized" | "ongoing" | "cancelled",
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
          : "Failed to update trip status. Please try again.",
      );
    }
  };

  if (loading) {
    return (
      <main className='min-h-screen bg-slate-950 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-slate-700 border-t-orange-500 rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-slate-400 font-medium'>Loading trip...</p>
        </div>
      </main>
    );
  }

  if (!trip) {
    return (
      <main className='min-h-screen bg-slate-950 flex items-center justify-center p-4'>
        <div className='text-center bg-slate-900 rounded-2xl shadow-lg border border-slate-800 p-8 max-w-md'>
          <div className='w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4'>
            <span className='text-3xl'>😞</span>
          </div>
          <h2 className='text-xl font-bold text-white mb-2'>Trip Not Found</h2>
          <p className='text-slate-400 mb-6'>
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
  const startDate = resolveDates(trip.startDate) || new Date();
  const endDate = resolveDates(trip.endDate) || new Date();
  const activities = trip.activities || [];
  const statusBadge = getStatusBadge(trip.status);

  return (
    <main className='min-h-screen bg-slate-950 pb-24 relative overflow-hidden'>
      {/* Background Effects */}
      <div className='absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none'>
        <div className='absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-3xl'></div>
        <div className='absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-3xl'></div>
      </div>

      <div className='max-w-4xl mx-auto px-4 py-6 relative z-10'>
        {/* Navigation Bar */}
        <div className='flex items-center justify-between mb-8'>
          <button
            onClick={() => router.push(`/group/${groupId}`)}
            className='p-2 -ml-2 rounded-xl hover:bg-white/5 transition-colors inline-flex items-center gap-2 text-slate-400 hover:text-white'
          >
            <ArrowLeft className='w-5 h-5' />
          </button>
          <div className='flex bg-slate-800/50 p-1 rounded-xl backdrop-blur-md border border-white/5'>
            <button
              onClick={() => handleTabChange("schedule")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "schedule"
                  ? "bg-slate-700 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className='flex items-center gap-2'>
                <List className='w-4 h-4' />
                <span className='hidden sm:inline'>Timeline</span>
              </span>
            </button>
            <button
              onClick={() => handleTabChange("calendar")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "calendar"
                  ? "bg-slate-700 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className='flex items-center gap-2'>
                <Calendar className='w-4 h-4' />
                <span className='hidden sm:inline'>Calendar</span>
              </span>
            </button>
            <button
              onClick={() => handleTabChange("expenses")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "expenses"
                  ? "bg-slate-700 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className='flex items-center gap-2'>
                <DollarSign className='w-4 h-4' />
                <span className='hidden sm:inline'>Expenses</span>
              </span>
            </button>
          </div>
          <div className='w-9' /> {/* Spacer for balance */}
        </div>

        {/* Trip Header */}
        <div className='mb-8'>
          <div className='flex flex-col md:flex-row md:items-end justify-between gap-4'>
            <div>
              <div className='flex items-center gap-3 mb-2'>
                {!isEditingStatus ? (
                  <button
                    onClick={() => setIsEditingStatus(true)}
                    className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-lg border ${statusBadge.border} ${statusBadge.bg} ${statusBadge.text} hover:opacity-80 transition-opacity`}
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
                          | "cancelled",
                      )
                    }
                    onBlur={() => setIsEditingStatus(false)}
                    autoFocus
                    className='text-[10px] uppercase font-bold px-2 py-1 rounded-lg border border-slate-700 bg-slate-800 text-white focus:outline-none focus:border-orange-500'
                  >
                    <option value='planning'>PLANNING</option>
                    <option value='finalized'>FINALIZED</option>
                    <option value='ongoing'>ONGOING</option>
                    <option value='cancelled'>CANCELLED</option>
                  </select>
                )}
                {trip.createdBy && (
                  <span className='text-xs text-slate-500'>
                    by {trip.createdBy}
                  </span>
                )}
              </div>
              <h1 className='text-4xl md:text-5xl font-bold text-white mb-2 leading-tight'>
                {trip.name}
              </h1>
              <div className='flex items-center gap-2 text-slate-400'>
                <Calendar className='w-4 h-4' />
                <span>
                  {startDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                  {" - "}
                  {endDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            <div className='flex gap-3'>
              {activeTab === "schedule" && (
                <div className='relative'>
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    disabled={isExporting}
                    className='px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/5 text-slate-300 hover:text-white transition-all font-medium text-sm flex items-center gap-2 disabled:opacity-50'
                  >
                    {isExporting ? "Exporting..." : "Export"}
                    <ChevronDown className='w-4 h-4' />
                  </button>
                  {showExportMenu && (
                    <>
                      <div
                        className='fixed inset-0 z-10'
                        onClick={() => setShowExportMenu(false)}
                      />
                      <div className='absolute top-full right-0 mt-2 w-48 bg-slate-800 rounded-xl shadow-xl border border-white/10 overflow-hidden z-20'>
                        <button
                          onClick={() => {
                            handleExportSchedule("png");
                            setShowExportMenu(false);
                          }}
                          className='w-full px-4 py-3 text-left hover:bg-slate-700 text-slate-300 hover:text-white text-sm transition-colors'
                        >
                          Export as PNG
                        </button>
                        <button
                          onClick={() => {
                            handleExportSchedule("ics");
                            setShowExportMenu(false);
                          }}
                          className='w-full px-4 py-3 text-left hover:bg-slate-700 text-slate-300 hover:text-white text-sm transition-colors border-t border-white/5'
                        >
                          Export as Calendar (.ics)
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {isTripCreator && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className='p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 transition-all'
                  title='Delete Trip'
                >
                  <Trash2 className='w-5 h-5' />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className='bg-slate-800/20 backdrop-blur-xl rounded-3xl border border-white/5 p-4 sm:p-6 min-h-[400px]'>
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
                const dateStr = date ? date.toISOString().split("T")[0] : "";
                router.push(
                  `/group/${groupId}/trip/${tripId}/activities/add${dateStr ? `?date=${dateStr}` : ""}`,
                );
              }}
            />
          ) : activeTab === "expenses" ? (
            <ExpensesComponent
              groupId={groupId}
              tripId={tripId}
              isEmbedded={true}
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

        {/* Floating Add Activity/Expense Button */}
        <div className='fixed bottom-6 right-6 z-50'>
          <button
            onClick={() =>
              activeTab === "expenses"
                ? router.push(`/group/${groupId}/expenses/add?tripId=${tripId}`)
                : router.push(`/group/${groupId}/trip/${tripId}/activities/add`)
            }
            className='group flex items-center justify-center w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white rounded-full shadow-lg shadow-orange-500/30 transition-all hover:scale-110 active:scale-95'
            title={activeTab === "expenses" ? "Add Expense" : "Add Activity"}
          >
            <Plus className='w-7 h-7 transition-transform group-hover:rotate-90' />
            <span className='sr-only'>
              {activeTab === "expenses" ? "Add Expense" : "Add Activity"}
            </span>
          </button>
        </div>
      </div>

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
          onSelectExpense={() => {
            handleTabChange("expenses");
            setShowActivityDetailModal(false);
          }}
        />
      )}

      {isNavigating && <NavigationLoader message='Redirecting...' />}
    </main>
  );
};

export default TripComponent;
