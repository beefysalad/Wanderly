"use client";
import { Activity, Group, Trip } from "@/src/shared/types";
import {
  Calendar,
  DollarSign,
  ImageIcon,
  List,
  Loader2,
  MoreVertical,
  Plus,
  Trash2,
  Layout,
  PieChart,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
// BottomNav import removed
import api from "@/lib/axios";
import { getStatusBadge } from "@/lib/helper";
import {
  exportScheduleToICS,
  exportScheduleToPNG,
} from "@/lib/utils/exportSchedule";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { useExpenses } from "@/src/hooks/useExpenses";
import { useGroup } from "@/src/hooks/useGroups";
import { useNavigationLoading } from "@/src/hooks/useNavigationLoading";
import { useSocketGroupUpdates } from "@/src/hooks/useSocketGroupUpdates";
import { useDeleteTrip } from "@/src/hooks/useTrips";
import { useQueryClient } from "@tanstack/react-query";
import PremiumPageHeader from "../../shared/PremiumPageHeader";
import ActivityDetailModal from "../../shared/Modal/ActivityDetailModal";
import ActivityModal from "../../shared/Modal/ActivityModal";
import ConfirmDeleteModal from "../../shared/Modal/ConfirmDeleteModal";
import NavigationLoader from "../../shared/NavigationLoader";
import ExpensesComponent from "../Expenses";
import TravelCalendar from "./TravelCalendar";
import TravelSchedule from "./TravelSchedule";
import TravelDayOverview from "./TravelDayOverview";
import BudgetComponent from "../Budget"; // Added BudgetComponent import

interface ITripComponent {
  tripId: string;
  groupId: string;
}

type TabType = "calendar" | "schedule" | "expenses" | "daily" | "budget"; // Added "budget" to TabType

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
  const [activeTab, setActiveTab] = useState<TabType>("daily");

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

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (
      tab === "expenses" ||
      tab === "calendar" ||
      tab === "schedule" ||
      tab === "budget"
    ) {
      // Added "budget" to tab check
      setActiveTab(tab as TabType);
    }
  }, [searchParams]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);

    router.replace(`/group/${groupId}/trip/${tripId}?tab=${tab}`, {
      scroll: false,
    });
  };

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
                a.id === id ? { ...a, ...updates } : a,
              ),
            };
          }),
        },
      };
    });

    try {
      await api.patch(`/trips/${tripId}/activities/${id}`, updates);
      queryClient.refetchQueries({ queryKey: ["groups", groupId] });
    } catch (err) {
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
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
      queryClient.refetchQueries({
        queryKey: ["groups", groupId],
        type: "active",
      });
    } catch (err) {
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
    router.push(`/group/${groupId}/trip/${tripId}/activities/${activity.id}`);
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
      <main className='min-h-screen bg-slate-950 flex items-center justify-center p-6'>
        <div className='text-center'>
          <Loader2 className='w-8 h-8 animate-spin text-slate-400 mx-auto mb-3' />
          <p className='text-slate-400 text-sm'>Loading trip...</p>
        </div>
      </main>
    );
  }

  if (!trip) {
    return (
      <main className='min-h-screen bg-slate-950 flex items-center justify-center p-4'>
        <div className='text-center bg-slate-900/60 rounded-2xl border border-white/10 p-10 max-w-md'>
          <div className='w-14 h-14 bg-red-900/20 rounded-xl flex items-center justify-center mx-auto mb-4 border border-red-500/20'>
            <span className='text-3xl'>😞</span>
          </div>
          <h2 className='text-xl font-semibold text-white mb-2'>
            Trip Not Found
          </h2>
          <p className='text-slate-400 mb-6'>
            This trip doesn&apos;t exist or has been removed.
          </p>
          <button
            onClick={() => router.push(`/group/${groupId}`)}
            className='px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-white/10 transition-colors text-sm'
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
    <main className='min-h-screen bg-slate-950 pb-24 font-sans'>

      <PremiumPageHeader
        title='Trip Details'
        onBack={() => router.push(`/group/${groupId}`)}
        actions={
          <div className='relative'>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className='flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90'
            >
              <MoreVertical className='w-5 h-5' />
            </button>

            {showExportMenu && (
              <>
                <div
                  className='fixed inset-0 z-40'
                  onClick={() => setShowExportMenu(false)}
                />
                <div className='absolute right-0 top-full mt-3 w-56 bg-slate-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50'>
                  <div className='px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.1em] bg-white/5'>
                    Options
                  </div>
                  <div className='px-4 py-2 text-[10px] text-amber-300/90 bg-amber-500/10 border-b border-white/5'>
                    Export features are currently in beta.
                  </div>
                  <button
                    onClick={() => {
                      handleExportSchedule("png");
                      setShowExportMenu(false);
                    }}
                    disabled={isExporting}
                    className='w-full px-4 py-3.5 text-left hover:bg-white/5 text-slate-300 hover:text-white text-sm transition-colors flex items-center gap-3'
                  >
                    {isExporting ? (
                      <span className='w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin' />
                    ) : (
                      <ImageIcon className='w-4 h-4' />
                    )}
                    Export Itinerary (PNG) Beta
                  </button>
                  <button
                    onClick={() => {
                      handleExportSchedule("ics");
                      setShowExportMenu(false);
                    }}
                    disabled={isExporting}
                    className='w-full px-4 py-3.5 text-left hover:bg-white/5 text-slate-300 hover:text-white text-sm transition-colors border-t border-white/5 flex items-center gap-3'
                  >
                    {isExporting ? (
                      <span className='w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin' />
                    ) : (
                      <Calendar className='w-4 h-4' />
                    )}
                    Export Calendar (.ics) Beta
                  </button>

                  {isTripCreator && (
                    <>
                      <div className='px-4 py-2 text-[10px] font-black text-red-500/50 uppercase tracking-[0.2em] bg-red-500/5 border-t border-white/5'>
                        Danger Zone
                      </div>
                      <button
                        onClick={() => {
                          setShowDeleteModal(true);
                          setShowExportMenu(false);
                        }}
                        className='w-full px-4 py-3.5 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors border-t border-white/5'
                      >
                        <Trash2 className='w-4 h-4' />
                        Delete Trip
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        }
      />

      <div className='max-w-5xl mx-auto px-4 py-6'>
        {/* Trip Header */}
        <div className='mb-6 rounded-2xl border border-white/10 bg-slate-900/60 p-5 sm:p-6'>
          <div className='flex flex-col md:flex-row md:items-end justify-between gap-4'>
            <div className='text-center md:text-left'>
              <h1 className='text-3xl md:text-4xl font-semibold text-white mb-2 leading-tight'>
                {trip.name}
              </h1>
              <div className='flex items-center gap-3 mb-2 justify-center md:justify-start'>
                {!isEditingStatus ? (
                  <button
                    onClick={() => setIsEditingStatus(true)}
                    className='text-[11px] uppercase tracking-wide font-medium px-2.5 py-1 rounded-md bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-colors'
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
                    className='text-xs uppercase font-medium px-3 py-1.5 rounded-md border border-white/10 bg-slate-800 text-slate-200 focus:outline-none focus:border-slate-500 cursor-pointer'
                  >
                    <option
                      value='planning'
                      className='bg-slate-900 text-white'
                    >
                      PLANNING
                    </option>
                    <option
                      value='finalized'
                      className='bg-slate-900 text-white'
                    >
                      FINALIZED
                    </option>
                    <option value='ongoing' className='bg-slate-900 text-white'>
                      ONGOING
                    </option>
                    <option
                      value='cancelled'
                      className='bg-slate-900 text-white'
                    >
                      CANCELLED
                    </option>
                  </select>
                )}
                {trip.createdBy && (
                  <span className='text-xs text-slate-400'>
                    by {trip.createdBy}
                  </span>
                )}
              </div>

              <div className='flex items-center gap-2 text-slate-400 justify-center md:justify-start text-sm'>
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
          </div>
        </div>
        <div className='bg-slate-900/60 rounded-2xl border border-white/10 p-4 sm:p-6 min-h-[400px]'>
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
            ) : activeTab === "budget" ? (
              <BudgetComponent
                groupId={groupId}
                tripId={tripId}
                isEmbedded={true}
              />
            ) : activeTab === "daily" ? (
              <TravelDayOverview
                startDate={startDate}
                endDate={endDate}
                activities={activities}
                onAddActivity={addActivity}
                onUpdateActivity={updateActivity}
                onDeleteActivity={deleteActivity}
                onToggleDone={toggleDone}
                onEditActivity={handleEditActivity}
                onViewActivity={handleViewActivity}
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
        {/* Floating Action Buttons */}
        <div className='fixed bottom-24 right-6 z-50 flex flex-col gap-3'>
          <button
            onClick={() =>
              activeTab === "expenses"
                ? router.push(`/group/${groupId}/expenses/add?tripId=${tripId}`)
                : activeTab === "budget"
                  ? router.push(`/group/${groupId}/trip/${tripId}/budget/add`)
                  : router.push(
                      `/group/${groupId}/trip/${tripId}/activities/add`,
                    )
            }
            className='group flex items-center justify-center w-14 h-14 bg-orange-500 hover:bg-orange-400 text-white rounded-full shadow-lg transition-all hover:scale-105 active:scale-95'
            title={
              activeTab === "expenses"
                ? "Add Expense"
                : activeTab === "budget"
                  ? "Add Budget"
                  : "Add Activity"
            }
          >
            <Plus className='w-7 h-7 transition-transform group-hover:rotate-90' />
            <span className='sr-only'>
              {activeTab === "expenses"
                ? "Add Expense"
                : activeTab === "budget"
                  ? "Add Budget"
                  : "Add Activity"}
            </span>
          </button>
        </div>
      </div>

      {/* Floating Tab Switcher */}
      <div className='fixed bottom-6 left-1/2 -translate-x-1/2 z-50'>
        <div className='flex bg-slate-900 p-1.5 rounded-full border border-white/10 shadow-xl'>
          <button
            onClick={() => handleTabChange("daily")}
            className={`group relative p-3 rounded-full transition-all duration-300 ${
              activeTab === "daily"
                ? "bg-white text-slate-900"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Layout className='w-5 h-5 transition-transform duration-300 group-hover:scale-110' />
            <span className='absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-slate-800 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap border border-white/10 shadow-lg mb-2'>
              Day Overview
            </span>
          </button>
          <button
            onClick={() => handleTabChange("schedule")}
            className={`group relative p-3 rounded-full transition-all duration-300 ${
              activeTab === "schedule"
                ? "bg-white text-slate-900"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <List className='w-5 h-5 transition-transform duration-300 group-hover:scale-110' />
            <span className='absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-slate-800 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap border border-white/10 shadow-lg mb-2'>
              Timeline
            </span>
          </button>
          <button
            onClick={() => handleTabChange("calendar")}
            className={`group relative p-3 rounded-full transition-all duration-300 ${
              activeTab === "calendar"
                ? "bg-white text-slate-900"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Calendar className='w-5 h-5 transition-transform duration-300 group-hover:scale-110' />
            <span className='absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-slate-800 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap border border-white/10 shadow-lg mb-2'>
              Calendar
            </span>
          </button>
          <button
            onClick={() => handleTabChange("expenses")}
            className={`group relative p-3 rounded-full transition-all duration-300 ${
              activeTab === "expenses"
                ? "bg-white text-slate-900"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <DollarSign className='w-5 h-5 transition-transform duration-300 group-hover:scale-110' />
            <span className='absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-slate-800 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap border border-white/10 shadow-lg mb-2'>
              Expenses
            </span>
          </button>
          <button
            onClick={() => handleTabChange("budget")}
            className={`group relative p-3 rounded-full transition-all duration-300 ${
              activeTab === "budget"
                ? "bg-white text-slate-900"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <PieChart className='w-5 h-5 transition-transform duration-300 group-hover:scale-110' />
            <span className='absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-slate-800 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap border border-white/10 shadow-lg mb-2'>
              Budget
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
