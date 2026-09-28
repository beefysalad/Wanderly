import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { useCreateActivity, useUpdateActivity } from "@/src/hooks/useActivities";
import type { Activity, Trip } from "@/src/shared/types";
import { activitySchema, type TActivitySchema } from "./activitySchema";
import { buildCreatePayload, buildUpdatePayload, getAvailableDates } from "./activityFormHelpers";

export type ActivityType = "general" | "flight" | "transport" | "accommodation" | "food";

interface IUseActivityFormArgs {
  mode: "add" | "edit";
  tripId: string;
  groupId: string;
  trip: Trip;
  /** The activity being edited. Ignored (and unnecessary) in "add" mode. */
  activity?: Activity;
  /** Add mode only: a date pre-filled from the calendar the user came from. */
  preSelectedDate?: Date | null;
  onSuccess: () => void;
}

/** Shared add/edit activity form logic: the react-hook-form instance, the type-picker step (add only), and submit. */
export function useActivityForm({ mode, tripId, groupId, trip, activity, preSelectedDate, onSuccess }: IUseActivityFormArgs) {
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(mode === "edit" ? 2 : 1);
  const [selectedType, setSelectedType] = useState<ActivityType | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const createActivity = useCreateActivity(tripId, groupId);
  const updateActivity = useUpdateActivity(tripId, groupId);

  const form = useForm<TActivitySchema>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      title: "",
      date: preSelectedDate ? preSelectedDate.toISOString().split("T")[0] : trip?.startDate ? new Date(trip.startDate).toISOString().split("T")[0] : "",
      startTime: "",
      endTime: "",
      location: "",
      notes: "",
      transportationMode: undefined,
      pickupTime: undefined,
      pickupLocation: undefined,
      dropoffLocation: undefined,
    },
  });

  // Add mode: fill in the trip's start date once it loads, if the user hasn't picked one already.
  useEffect(() => {
    if (mode === "add" && trip && !form.getValues("date") && !preSelectedDate) {
      form.setValue("date", new Date(trip.startDate).toISOString().split("T")[0]);
    }
  }, [mode, trip, form, preSelectedDate]);

  // Edit mode: load the activity's current values once it's available.
  useEffect(() => {
    if (mode === "edit" && activity) {
      form.reset({
        title: activity.title,
        date: new Date(activity.date).toISOString().split("T")[0],
        startTime: activity.startTime || "",
        endTime: activity.endTime || "",
        location: activity.location || "",
        notes: activity.notes || "",
        transportationMode: activity.transportationMode as TActivitySchema["transportationMode"],
        pickupTime: activity.pickupTime || undefined,
        pickupLocation: activity.pickupLocation || undefined,
        dropoffLocation: activity.dropoffLocation || undefined,
      });
    }
  }, [mode, activity, form]);

  const availableDates = getAvailableDates(trip);

  const handleTypeSelect = (type: ActivityType) => {
    setSelectedType(type);

    if (type === "flight") {
      form.setValue("transportationMode", "plane");
    } else if (type === "transport") {
      if (!form.getValues("transportationMode")) {
        form.setValue("transportationMode", "car");
      }
    } else {
      form.setValue("transportationMode", undefined);
    }

    setCurrentStep(2);
  };

  const handleBackToType = () => setCurrentStep(1);

  const handleSkipTransportation = () => {
    form.setValue("transportationMode", undefined);
    form.setValue("pickupTime", undefined);
    form.setValue("pickupLocation", undefined);
    form.setValue("dropoffLocation", undefined);
  };

  const onSubmit = async (values: TActivitySchema) => {
    try {
      setError(null);
      if (mode === "edit" && activity) {
        await updateActivity.mutateAsync({ activityId: activity.id, updates: buildUpdatePayload(values) });
      } else {
        await createActivity.mutateAsync(buildCreatePayload(values));
      }
      // The mutation succeeded; onSuccess navigates away. No artificial delay needed first.
      setIsNavigating(true);
      onSuccess();
    } catch (err) {
      const message = (isAxiosError<{ error?: string }>(err) && err.response?.data?.error) || `Failed to ${mode === "edit" ? "update" : "save"} activity`;
      setError(message);
      setIsNavigating(false);
    }
  };

  return {
    form,
    error,
    currentStep,
    selectedType,
    availableDates,
    isNavigating,
    isSaving: createActivity.isPending || updateActivity.isPending || isNavigating,
    handleTypeSelect,
    handleBackToType,
    handleSkipTransportation,
    onSubmit,
  };
}
