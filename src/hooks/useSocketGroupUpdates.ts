import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSocket } from "./useSocket";
import { useCurrentUser } from "./useCurrentUser";

/**
 * Hook to listen for real-time group/trip/activity/expense updates via Socket.IO
 * Automatically invalidates relevant queries when updates are received
 */
export function useSocketGroupUpdates(groupId?: string) {
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const { user: currentUser } = useCurrentUser();

  useEffect(() => {
    if (!socket || !groupId) return;

    // Helper function to check if action was performed by current user
    const isCurrentUser = (emailOrName?: string | null) => {
      // If no current user or no identifier provided, assume not current user
      if (!currentUser || !emailOrName) return false;

      // Normalize strings for comparison
      const normalize = (str: string | null | undefined) =>
        str?.toLowerCase().trim() || "";

      const currentEmail = normalize(currentUser.email);
      const currentName = normalize(currentUser.displayName);
      const currentUid = currentUser.uid?.toLowerCase() || "";
      const actionIdentifier = normalize(emailOrName);

      // Compare with email, display name, or UID
      const isMatch =
        (currentEmail && currentEmail === actionIdentifier) ||
        (currentName && currentName === actionIdentifier) ||
        (currentUid && currentUid === actionIdentifier);

      // Debug logging (can be removed in production)
      if (isMatch) {
        console.log("Socket: Suppressing toast for current user action", {
          currentEmail,
          currentName,
          actionIdentifier,
        });
      }

      return isMatch;
    };

    // Join the group room
    socket.emit("join:group", groupId);

    // Handle group updates
    const handleGroupUpdate = () => {
      console.log("Socket: Group updated, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
    };

    const handleGroupDeleted = () => {
      console.log("Socket: Group deleted, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.removeQueries({ queryKey: ["groups", groupId] });
    };

    // Handle trip events
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleTripCreated = (trip: any) => {
      console.log("Socket: Trip created, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });

      // Only show toast if not the current user
      const creatorEmail = trip?.creator?.email;
      if (!isCurrentUser(creatorEmail)) {
        const creatorName =
          trip?.creator?.name || trip?.creator?.email || "Someone";
        toast.success(`${creatorName} created a trip`, {
          description: trip?.name || "A new trip has been created",
        });
      }
    };

    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleTripUpdated = (trip: any) => {
      console.log("Socket: Trip updated, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });

      // Only show toast if not the current user
      const creatorEmail = trip?.creator?.email;
      if (!isCurrentUser(creatorEmail)) {
        const creatorName =
          trip?.creator?.name || trip?.creator?.email || "Someone";
        toast.info(`${creatorName} updated a trip`, {
          description: trip?.name || "A trip has been updated",
        });
      }
    };

    const handleTripDeleted = (data: {
      tripId: string;
      deletedBy?: string;
      tripName?: string;
    }) => {
      console.log("Socket: Trip deleted, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });

      // Only show toast if not the current user
      if (!isCurrentUser(data.deletedBy)) {
        const deleterName = data.deletedBy || "Someone";
        toast.error(`${deleterName} deleted a trip`, {
          description: data.tripName || "A trip has been deleted",
        });
      }
    };

    // Handle activity events
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleActivityCreated = (activity: any) => {
      console.log("Socket: Activity created, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
      // Invalidate all expenses queries since activities might be linked
      queryClient.invalidateQueries({ queryKey: ["expenses"] });

      // Only show toast if not the current user
      const createdBy = activity?.createdBy;
      if (!isCurrentUser(createdBy)) {
        const creatorName = createdBy || "Someone";
        toast.success(`${creatorName} created an activity`, {
          description: activity?.title || "A new activity has been created",
        });
      }
    };

    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleActivityUpdated = (activity: any) => {
      console.log("Socket: Activity updated, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });

      // Only show toast if not the current user
      const updatedBy = activity?.updatedBy;
      if (!isCurrentUser(updatedBy)) {
        const updaterName = updatedBy || "Someone";
        toast.info(`${updaterName} updated an activity`, {
          description: activity?.title || "An activity has been updated",
        });
      }
    };

    const handleActivityDeleted = (data: {
      activityId: string;
      deletedBy?: string;
      activityTitle?: string;
    }) => {
      console.log("Socket: Activity deleted, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });

      // Only show toast if not the current user
      if (!isCurrentUser(data.deletedBy)) {
        const deleterName = data.deletedBy || "Someone";
        toast.error(`${deleterName} deleted an activity`, {
          description: data.activityTitle || "An activity has been deleted",
        });
      }
    };

    // Handle expense events
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleExpenseCreated = (expense: any) => {
      console.log("Socket: Expense created, invalidating queries", {
        expense: expense,
        paidBy: expense?.paidBy,
        currentUser: currentUser?.email,
      });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
      queryClient.invalidateQueries({ queryKey: ["paymentLogs"] });

      // Only show toast if not the current user
      // Handle both object and string formats for paidBy
      let creatorEmail: string | undefined;
      let creatorName: string | undefined;

      if (typeof expense?.paidBy === "string") {
        // If paidBy is a string (email), use it directly
        creatorEmail = expense.paidBy;
      } else if (expense?.paidBy && typeof expense.paidBy === "object") {
        // If paidBy is an object, extract email and name
        creatorEmail = expense.paidBy.email;
        creatorName = expense.paidBy.name;
      }

      // If we can't identify the creator, show toast to everyone
      // Otherwise, only show if not the current user
      const canIdentifyCreator = !!(creatorEmail || creatorName);
      const isCreator =
        canIdentifyCreator &&
        (isCurrentUser(creatorEmail) || isCurrentUser(creatorName));

      console.log("Socket: Expense created check", {
        creatorEmail,
        creatorName,
        currentUserEmail: currentUser?.email,
        isCreator,
        canIdentifyCreator,
        willShowToast: !isCreator,
        paidByType: typeof expense?.paidBy,
        paidByValue: expense?.paidBy,
      });

      if (!isCreator) {
        const displayName = creatorName || creatorEmail || "Someone";
        toast.success(`${displayName} created an expense`, {
          description: expense?.description
            ? `${expense.description} - ₱${expense.amount || 0}`
            : "A new expense has been created",
        });
      } else {
        console.log(
          "Socket: Suppressing expense created toast for current user"
        );
      }
    };

    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleExpenseUpdated = (expense: any) => {
      console.log("Socket: Expense updated, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
      queryClient.invalidateQueries({ queryKey: ["paymentLogs"] });

      // Only show toast if not the current user
      // Handle both object and string formats for paidBy
      let updaterEmail: string | undefined;
      let updaterName: string | undefined;

      if (typeof expense?.paidBy === "string") {
        // If paidBy is a string (email), use it directly
        updaterEmail = expense.paidBy;
      } else if (expense?.paidBy && typeof expense.paidBy === "object") {
        // If paidBy is an object, extract email and name
        updaterEmail = expense.paidBy.email;
        updaterName = expense.paidBy.name;
      }

      const isUpdater =
        isCurrentUser(updaterEmail) || isCurrentUser(updaterName);

      if (!isUpdater) {
        const displayName = updaterName || updaterEmail || "Someone";
        toast.info(`${displayName} updated an expense`, {
          description: expense?.description
            ? `${expense.description} - ₱${expense.amount || 0}`
            : "An expense has been updated",
        });
      }
    };

    const handleExpenseDeleted = (data: {
      expenseId: string;
      deletedBy?: string;
      expenseDescription?: string;
    }) => {
      console.log("Socket: Expense deleted, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
      queryClient.invalidateQueries({ queryKey: ["paymentLogs"] });

      // Only show toast if not the current user
      if (!isCurrentUser(data.deletedBy)) {
        const deleterName = data.deletedBy || "Someone";
        toast.error(`${deleterName} deleted an expense`, {
          description: data.expenseDescription || "An expense has been deleted",
        });
      }
    };

    // Register event listeners
    socket.on("group:updated", handleGroupUpdate);
    socket.on("group:deleted", handleGroupDeleted);
    socket.on("trip:created", handleTripCreated);
    socket.on("trip:updated", handleTripUpdated);
    socket.on("trip:deleted", handleTripDeleted);
    socket.on("activity:created", handleActivityCreated);
    socket.on("activity:updated", handleActivityUpdated);
    socket.on("activity:deleted", handleActivityDeleted);
    socket.on("expense:created", handleExpenseCreated);
    socket.on("expense:updated", handleExpenseUpdated);
    socket.on("expense:deleted", handleExpenseDeleted);

    // Cleanup on unmount or when groupId changes
    return () => {
      socket.emit("leave:group", groupId);
      socket.off("group:updated", handleGroupUpdate);
      socket.off("group:deleted", handleGroupDeleted);
      socket.off("trip:created", handleTripCreated);
      socket.off("trip:updated", handleTripUpdated);
      socket.off("trip:deleted", handleTripDeleted);
      socket.off("activity:created", handleActivityCreated);
      socket.off("activity:updated", handleActivityUpdated);
      socket.off("activity:deleted", handleActivityDeleted);
      socket.off("expense:created", handleExpenseCreated);
      socket.off("expense:updated", handleExpenseUpdated);
      socket.off("expense:deleted", handleExpenseDeleted);
    };
  }, [socket, groupId, queryClient, currentUser]);
}
