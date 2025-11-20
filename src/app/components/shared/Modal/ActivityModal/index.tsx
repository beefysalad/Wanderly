import { Activity } from "@/src/shared/types";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { activitySchema, TActivitySchema } from "./activityAddZod";

const transportationModes = [
  "commute",
  "car",
  "plane",
  "bus",
  "train",
  "taxi",
  "walking",
  "other",
] as const;
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Calendar,
  Clock,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Navigation,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateActivity,
  useUpdateActivity,
} from "@/src/hooks/useActivities";

interface IActivityModal {
  tripId: string;
  groupId: string;
  startDate: Date;
  endDate: Date;
  onClose: () => void;
  preSelectedDate?: Date | null;
  isDateLocked?: boolean;
  editingActivity?: Activity | null;
}

type Step = 1 | 2 | 3;

const ActivityModal = ({
  tripId,
  groupId,
  endDate,
  onClose,
  startDate,
  editingActivity,
  isDateLocked,
  preSelectedDate,
}: IActivityModal) => {
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const createActivity = useCreateActivity(tripId, groupId);
  const updateActivity = useUpdateActivity(
    tripId,
    editingActivity?.id || "",
    groupId
  );

  const form = useForm<TActivitySchema>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      title: editingActivity?.title || "",
      date:
        editingActivity?.date ||
        (preSelectedDate
          ? preSelectedDate.toISOString().split("T")[0]
          : startDate.toISOString().split("T")[0]),
      startTime: editingActivity?.startTime || "",
      endTime: editingActivity?.endTime || "",
      notes: editingActivity?.notes || "",
      transportationMode:
        (editingActivity?.transportationMode as
          | (typeof transportationModes)[number]
          | undefined) || undefined,
      pickupTime: editingActivity?.pickupTime || undefined,
      pickupLocation: editingActivity?.pickupLocation || undefined,
      dropoffLocation: editingActivity?.dropoffLocation || undefined,
    },
  });

  // Determine initial step based on editing activity
  useEffect(() => {
    if (editingActivity) {
      // If editing and has transportation, start at step 3
      if (
        editingActivity.transportationMode ||
        editingActivity.pickupTime ||
        editingActivity.pickupLocation ||
        editingActivity.dropoffLocation
      ) {
        setCurrentStep(3);
      }
      // If has time details, start at step 2
      else if (editingActivity.startTime || editingActivity.endTime) {
        setCurrentStep(2);
      }
    }
  }, [editingActivity]);

  // Helper function to get transportation mode icon
  const getTransportationIcon = (mode?: string) => {
    switch (mode) {
      case "car":
        return "🚗";
      case "bus":
        return "🚌";
      case "plane":
        return "✈️";
      case "train":
        return "🚊";
      case "taxi":
        return "🚕";
      case "walking":
        return "🚶";
      case "commute":
        return "🚌";
      default:
        return "🚗";
    }
  };

  // Helper function to get transportation mode display text
  const getTransportationLabel = (mode: string) => {
    switch (mode) {
      case "commute":
        return "🚌 Commute (Public Transport)";
      case "car":
        return "🚗 Car (Private Vehicle)";
      case "plane":
        return "✈️ Plane (Air Travel)";
      case "bus":
        return "🚌 Bus";
      case "train":
        return "🚊 Train";
      case "taxi":
        return "🚕 Taxi/Rideshare";
      case "walking":
        return "🚶 Walking";
      case "other":
        return "Other";
      default:
        return "Select mode...";
    }
  };

  const onSubmit = async (values: TActivitySchema) => {
    try {
      setError(null);

      if (editingActivity) {
        const updateData = {
          title: values.title,
          date: values.date,
          startTime: values.startTime || undefined,
          endTime: values.endTime || undefined,
          notes: values.notes || undefined,
          transportationMode: values.transportationMode
            ? (values.transportationMode as (typeof transportationModes)[number])
            : null,
          pickupTime:
            values.pickupTime && values.pickupTime.trim() !== ""
              ? values.pickupTime
              : null,
          pickupLocation:
            values.pickupLocation && values.pickupLocation.trim() !== ""
              ? values.pickupLocation
              : null,
          dropoffLocation:
            values.dropoffLocation && values.dropoffLocation.trim() !== ""
              ? values.dropoffLocation
              : null,
        };
        await updateActivity.mutateAsync(updateData);
      } else {
        await createActivity.mutateAsync({
          title: values.title,
          date: values.date,
          startTime: values.startTime || undefined,
          endTime: values.endTime || undefined,
          notes: values.notes || undefined,
          transportationMode: values.transportationMode
            ? (values.transportationMode as (typeof transportationModes)[number])
            : undefined,
          pickupTime: values.pickupTime || undefined,
          pickupLocation: values.pickupLocation || undefined,
          dropoffLocation: values.dropoffLocation || undefined,
        });
      }
      onClose();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { error?: string } } })?.response
              ?.data?.error || "Failed to save activity";
      setError(message);
    }
  };

  const isLoading = createActivity.isPending || updateActivity.isPending;

  const availableDates = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    availableDates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  // Step validation
  const validateStep = async (step: Step): Promise<boolean> => {
    if (step === 1) {
      return await form.trigger(["title", "date"]);
    } else if (step === 2) {
      // Step 2 is optional, so always allow
      return true;
    } else if (step === 3) {
      // Step 3 is optional, so always allow
      return true;
    }
    return false;
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleSkipTransportation = async () => {
    // Clear transportation fields and submit
    form.setValue("transportationMode", undefined);
    form.setValue("pickupTime", undefined);
    form.setValue("pickupLocation", undefined);
    form.setValue("dropoffLocation", undefined);
    await form.handleSubmit(onSubmit)();
  };

  const steps = [
    {
      number: 1,
      title: "Basic Info",
      icon: Calendar,
      description: "Title and date",
    },
    {
      number: 2,
      title: "Time & Details",
      icon: Clock,
      description: "Schedule and notes",
    },
    {
      number: 3,
      title: "Transportation",
      icon: Navigation,
      description: "Optional travel details",
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50" style={{ paddingBottom: "max(5rem, env(safe-area-inset-bottom, 0px) + 5rem)" }}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-xs sm:max-w-2xl w-full max-h-[75vh] sm:max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-6 pb-2 sm:pb-4 flex-shrink-0 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">
              {editingActivity ? "Edit Event" : "Add Event"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
              Step {currentStep} of {steps.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-center max-w-md mx-auto relative">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              const isLast = index === steps.length - 1;

              return (
                <React.Fragment key={step.number}>
                  <div className="flex items-center justify-center flex-1 relative">
                    {/* Step Circle */}
                    <div className="flex flex-col items-center gap-1 sm:gap-2 flex-shrink-0 z-10">
                      <div
                        className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                          isCompleted
                            ? "bg-orange-500 border-orange-500 text-white"
                            : isActive
                            ? "bg-orange-100 dark:bg-orange-900/30 border-orange-500 text-orange-600 dark:text-orange-400"
                            : "bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-400"
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                        ) : (
                          <StepIcon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                        )}
                      </div>
                      <div className="text-center hidden sm:block">
                        <p
                          className={`text-xs font-semibold ${
                            isActive
                              ? "text-slate-900 dark:text-white"
                              : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {step.title}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">
                          {step.description}
                        </p>
                      </div>
                    </div>
                    {/* Connector Line */}
                    {!isLast && (
                      <div
                        className={`absolute left-[50%] right-0 h-0.5 top-[14px] sm:top-[20px] transition-all duration-200 ${
                          isCompleted
                            ? "bg-orange-500"
                            : "bg-slate-200 dark:bg-slate-700"
                        }`}
                        style={{ width: "calc(100% - 1.75rem)" }}
                      />
                    )}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (currentStep === 3) {
              form.handleSubmit(onSubmit)(e);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && currentStep !== 3) {
              e.preventDefault();
            }
          }}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 sm:py-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-1">
                    What&apos;s happening?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-3 sm:mb-4">
                    Give your event a clear, descriptive title
                  </p>
                  <input
                    type="text"
                    {...form.register("title")}
                    placeholder="e.g., Lunch at Torre Eiffel"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-sm sm:text-base"
                    autoFocus
                  />
                  {form.formState.errors.title && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                      {form.formState.errors.title.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm sm:text-base font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date
                  </label>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-3 sm:mb-4">
                    When is this event happening?
                  </p>
                  <select
                    {...form.register("date")}
                    disabled={isDateLocked}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    {availableDates.map((d) => (
                      <option
                        key={d.toISOString()}
                        value={d.toISOString().split("T")[0]}
                      >
                        {d.toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Step 2: Time & Details */}
            {currentStep === 2 && (
              <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                    Time Range
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-3 sm:mb-4">
                    When does this event start and end? (Optional)
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Start Time
                      </label>
                      <Input
                        type="time"
                        {...form.register("startTime")}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-sm sm:text-base"
                        style={{ WebkitAppearance: "none", appearance: "none" }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        End Time
                      </label>
                      <Input
                        type="time"
                        {...form.register("endTime")}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-sm sm:text-base"
                        style={{ WebkitAppearance: "none", appearance: "none" }}
                      />
                    </div>
                  </div>
                  {form.formState.errors.startTime && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                      {form.formState.errors.startTime.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm sm:text-base font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Notes
                  </label>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-3 sm:mb-4">
                    Add any additional details about this event (Optional)
                  </p>
                  <textarea
                    {...form.register("notes")}
                    placeholder="Any details about this event..."
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none text-sm sm:text-base"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Transportation */}
            {currentStep === 3 && (
              <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                    <Navigation className="w-4 h-4 sm:w-5 sm:h-5" />
                    Transportation Details
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-3 sm:mb-4">
                    Add transportation information if needed (Optional)
                  </p>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Mode of Transportation
                  </label>
                  <Select
                    value={form.watch("transportationMode") || ""}
                    onValueChange={(value) => {
                      const modeValue =
                        value === ""
                          ? undefined
                          : (value as (typeof transportationModes)[number]);
                      form.setValue("transportationMode", modeValue, {
                        shouldValidate: false,
                      });
                    }}
                  >
                    <SelectTrigger 
                      className="w-full"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                    >
                      <SelectValue placeholder="Select mode..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="commute">
                        🚌 Commute (Public Transport)
                      </SelectItem>
                      <SelectItem value="car">🚗 Car (Private Vehicle)</SelectItem>
                      <SelectItem value="plane">✈️ Plane (Air Travel)</SelectItem>
                      <SelectItem value="bus">🚌 Bus</SelectItem>
                      <SelectItem value="train">🚊 Train</SelectItem>
                      <SelectItem value="taxi">🚕 Taxi/Rideshare</SelectItem>
                      <SelectItem value="walking">🚶 Walking</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Pickup Time - only show for modes that need pickup */}
                {form.watch("transportationMode") &&
                  form.watch("transportationMode") !== "plane" &&
                  form.watch("transportationMode") !== "walking" && (
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Pickup Time
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                          (optional)
                        </span>
                      </label>
                      <Input
                        type="time"
                        {...form.register("pickupTime")}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-sm sm:text-base"
                        style={{ WebkitAppearance: "none", appearance: "none" }}
                      />
                    </div>
                  )}

                {/* Pickup Location */}
                {form.watch("transportationMode") &&
                  form.watch("transportationMode") !== "plane" &&
                  form.watch("transportationMode") !== "walking" && (
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Pickup Location
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                          (optional)
                        </span>
                      </label>
                      <input
                        type="text"
                        {...form.register("pickupLocation")}
                        placeholder="e.g., Hotel lobby, Bus station"
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-sm sm:text-base"
                      />
                    </div>
                  )}

                {/* Dropoff Location */}
                {form.watch("transportationMode") &&
                  form.watch("transportationMode") !== "plane" &&
                  form.watch("transportationMode") !== "walking" && (
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Dropoff Location
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                          (optional)
                        </span>
                      </label>
                      <input
                        type="text"
                        {...form.register("dropoffLocation")}
                        placeholder="e.g., Restaurant, Hotel"
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-sm sm:text-base"
                      />
                    </div>
                  )}

                {/* Flight-specific fields */}
                {form.watch("transportationMode") === "plane" && (
                    <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-slate-200 dark:border-slate-700">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Departure Airport
                          <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                            (optional)
                          </span>
                        </label>
                        <input
                          type="text"
                          {...form.register("pickupLocation")}
                          placeholder="e.g., NAIA Terminal 3"
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-sm sm:text-base"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Arrival Airport
                          <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                            (optional)
                          </span>
                        </label>
                        <input
                          type="text"
                          {...form.register("dropoffLocation")}
                          placeholder="e.g., Incheon International Airport"
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-sm sm:text-base"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Departure Time
                          <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                            (optional)
                          </span>
                        </label>
                        <Input
                          type="time"
                          {...form.register("pickupTime")}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-sm sm:text-base"
                          style={{ WebkitAppearance: "none", appearance: "none" }}
                        />
                      </div>
                    </div>
                )}

                {/* Clear Transportation Button */}
                {form.watch("transportationMode") && (
                  <button
                    type="button"
                    onClick={() => {
                      form.setValue("transportationMode", undefined, {
                        shouldValidate: false,
                      });
                      form.setValue("pickupTime", undefined, {
                        shouldValidate: false,
                      });
                      form.setValue("pickupLocation", undefined, {
                        shouldValidate: false,
                      });
                      form.setValue("dropoffLocation", undefined, {
                        shouldValidate: false,
                      });
                    }}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors border-2 border-red-200 dark:border-red-800 font-medium"
                  >
                    Clear Transportation Info
                  </button>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-2 sm:gap-3 p-3 sm:p-6 pt-2 sm:pt-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-800">
            <div className="flex items-center gap-2">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={isLoading}
                  className="p-2.5 sm:p-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  title="Previous"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}
              {currentStep === 3 && (
                <button
                  type="button"
                  onClick={handleSkipTransportation}
                  disabled={isLoading}
                  className="p-2.5 sm:p-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  title="Skip"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}
            </div>

            <div className="flex-1" />

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={isLoading}
                className="px-4 sm:px-6 py-2.5 sm:py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit(onSubmit)();
                }}
                disabled={isLoading}
                className="px-4 sm:px-6 py-2.5 sm:py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading
                  ? editingActivity
                    ? "Updating..."
                    : "Adding..."
                  : editingActivity
                  ? "Update Event"
                  : "Add Event"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActivityModal;
