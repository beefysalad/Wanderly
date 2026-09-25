import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { exportScheduleToICS, exportScheduleToPNG } from "@/lib/utils/exportSchedule";
import { useNavigationLoading } from "@/src/hooks/useNavigationLoading";
import { useDeleteTrip } from "@/src/hooks/useTrips";
import type { Activity, Trip } from "@/src/shared/types";
import { patchActivityInCache, patchTripInCache } from "./tripCache";

type TripStatus = "planning" | "finalized" | "ongoing" | "cancelled";

const errorMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

/** All of the trip page's mutations (activities, status, export, delete) and their UI flags. */
export function useTripActions(groupId: string, tripId: string, trip: Trip | null) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const deleteTrip = useDeleteTrip(groupId, tripId);
  const { isNavigating, withNavigation } = useNavigationLoading();

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showDeleteActivityModal, setShowDeleteActivityModal] = useState<boolean>(false);
  const [activityToDelete, setActivityToDelete] = useState<string | null>(null);
  const [isEditingStatus, setIsEditingStatus] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [isDeletingActivity, setIsDeletingActivity] = useState<boolean>(false);

  const handleDeleteTrip = async () => {
    try {
      await withNavigation(async () => {
        await deleteTrip.mutateAsync();
        router.push(`/group/${groupId}`);
      });
    } catch (err) {
      setShowDeleteModal(false);
      alert(errorMessage(err, "Failed to delete trip. Please try again."));
    }
  };

  const handleExportSchedule = async (format: "png" | "ics") => {
    if (!trip) return;

    setIsExporting(true);
    setShowExportMenu(false);
    try {
      if (format === "png") {
        await exportScheduleToPNG({ trip, activities: trip.activities || [] });
      } else {
        await exportScheduleToICS({ trip, activities: trip.activities || [] });
      }
    } catch (error) {
      console.error("Failed to export schedule:", error);
      alert(errorMessage(error, "Failed to export schedule. Please try again."));
    } finally {
      setIsExporting(false);
    }
  };

  const handleUpdateActivity = async (id: string, updates: Partial<Activity>) => {
    patchActivityInCache(queryClient, groupId, tripId, id, (a) => ({ ...a, ...updates }));

    try {
      await api.patch(`/trips/${tripId}/activities/${id}`, updates);
      queryClient.refetchQueries({ queryKey: ["groups", groupId] });
    } catch (err) {
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
      alert(errorMessage(err, "Failed to update activity. Please try again."));
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
      alert(errorMessage(err, "Failed to delete activity. Please try again."));
    } finally {
      setIsDeletingActivity(false);
    }
  };

  const openDeleteActivityModal = (id: string) => {
    setActivityToDelete(id);
    setShowDeleteActivityModal(true);
  };

  const closeDeleteActivityModal = () => {
    setShowDeleteActivityModal(false);
    setActivityToDelete(null);
  };

  const handleToggleDone = async (id: string) => {
    if (!trip) return;
    const activity = trip.activities?.find((a) => a.id === id);
    if (!activity) return;

    const newDoneState = !activity.done;
    const previousState = activity.done;

    patchActivityInCache(queryClient, groupId, tripId, id, (a) => ({ ...a, done: newDoneState }));

    try {
      await api.patch(`/trips/${tripId}/activities/${id}`, { done: newDoneState });
      queryClient.refetchQueries({ queryKey: ["groups", groupId], type: "active" });
    } catch (err) {
      patchActivityInCache(queryClient, groupId, tripId, id, (a) => ({ ...a, done: previousState }));
      alert(errorMessage(err, "Failed to update activity. Please try again."));
    }
  };

  const handleStatusChange = async (newStatus: TripStatus) => {
    if (!trip) return;

    const previousStatus = trip.status || "planning";

    // Optimistically update the cache
    patchTripInCache(queryClient, groupId, tripId, (t) => ({ ...t, status: newStatus }));

    setIsEditingStatus(false);

    try {
      await api.patch(`/groups/${groupId}/trips/${tripId}`, { status: newStatus });
      // Silently refetch in the background to sync with server
      queryClient.refetchQueries({ queryKey: ["groups", groupId], type: "active" });
    } catch (err) {
      // Revert optimistic update on error
      patchTripInCache(queryClient, groupId, tripId, (t) => ({ ...t, status: previousStatus }));
      setIsEditingStatus(true); // Keep editing mode open on error
      alert(errorMessage(err, "Failed to update trip status. Please try again."));
    }
  };

  return {
    isNavigating,
    deleteTripPending: deleteTrip.isPending,
    showDeleteModal,
    setShowDeleteModal,
    showDeleteActivityModal,
    isDeletingActivity,
    isEditingStatus,
    setIsEditingStatus,
    isExporting,
    showExportMenu,
    setShowExportMenu,
    handleDeleteTrip,
    handleExportSchedule,
    handleUpdateActivity,
    handleDeleteActivity,
    openDeleteActivityModal,
    closeDeleteActivityModal,
    handleToggleDone,
    handleStatusChange,
  };
}
