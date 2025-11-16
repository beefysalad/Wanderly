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
import { Calendar, Clock, FileText, X, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  const [isTransportationExpanded, setIsTransportationExpanded] =
    useState(false);
  const createActivity = useCreateActivity(tripId, groupId);
  const updateActivity = useUpdateActivity(
    tripId,
    editingActivity?.id || "",
    groupId
  );

  // Auto-expand transportation section if editing activity with transportation data
  useEffect(() => {
    if (
      editingActivity &&
      (editingActivity.transportationMode ||
        editingActivity.pickupTime ||
        editingActivity.pickupLocation ||
        editingActivity.dropoffLocation)
    ) {
      setIsTransportationExpanded(true);
    }
  }, [editingActivity]);

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

  // Helper function to get transportation summary
  const getTransportationSummary = () => {
    const mode = form.watch("transportationMode");
    const pickupTime = form.watch("pickupTime");
    const parts: string[] = [];
    if (mode)
      parts.push(
        `${getTransportationIcon(mode)} ${
          mode.charAt(0).toUpperCase() + mode.slice(1)
        }`
      );
    if (pickupTime) {
      const label = mode === "plane" ? "Departure" : "Pickup";
      parts.push(`${label}: ${pickupTime}`);
    }
    return parts.length > 0 ? parts.join(" | ") : null;
  };

  const onSubmit = async (values: TActivitySchema) => {
    try {
      setError(null);

      if (editingActivity) {
        // Update existing activity - always include transportation fields explicitly
        // This ensures cleared fields (undefined or empty string) are converted to null and sent to API
        const updateData = {
          title: values.title,
          date: values.date,
          startTime: values.startTime || undefined,
          endTime: values.endTime || undefined,
          notes: values.notes || undefined,
          // Explicitly include transportation fields, converting undefined/empty to null
          // This allows the API to clear existing transportation data
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
        // Create new activity - only send if they have values (convert empty strings to undefined)
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

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50'>
      <div className='bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-center justify-between mb-6'>
          <h2 className='text-xl font-bold text-slate-900 dark:text-white'>
            {editingActivity ? "Edit Event" : "Add Event"}
          </h2>
          <button
            onClick={onClose}
            className='p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors'
          >
            <X className='w-5 h-5 text-slate-500' />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
          {/* Title */}
          <div>
            <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
              What&apos;s happening?
            </label>
            <input
              type='text'
              {...form.register("title")}
              placeholder='e.g., Lunch at Torre Eiffel'
              className='w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
              autoFocus
            />
          </div>

          {/* Date */}
          <div>
            <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2'>
              <Calendar className='w-4 h-4' />
              Date
            </label>
            <select
              {...form.register("date")}
              disabled={isDateLocked}
              className='w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {availableDates.map((d) => (
                <option
                  key={d.toISOString()}
                  value={d.toISOString().split("T")[0]}
                >
                  {d.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </option>
              ))}
            </select>
          </div>

          {/* Time Range */}
          <div>
            <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2'>
              <Clock className='w-4 h-4' />
              Time Range{" "}
              <span className='text-xs text-slate-500 dark:text-slate-400'>
                (optional)
              </span>
            </label>
            <div className='flex gap-2'>
              <div className='flex-1'>
                <Input
                  type='time'
                  {...form.register("startTime")}
                  placeholder='Start'
                  className='w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                  style={{ WebkitAppearance: "none", appearance: "none" }}
                />
              </div>
              <div className='flex items-center text-slate-500'>—</div>
              <div className='flex-1'>
                <Input
                  type='time'
                  {...form.register("endTime")}
                  placeholder='End'
                  className='w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                  style={{ WebkitAppearance: "none", appearance: "none" }}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2'>
              <FileText className='w-4 h-4' />
              Notes{" "}
              <span className='text-xs text-slate-500 dark:text-slate-400'>
                (optional)
              </span>
            </label>
            <textarea
              {...form.register("notes")}
              placeholder='Any details about this event...'
              rows={3}
              className='w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
            />
          </div>

          {/* Transportation Accordion Section */}
          <div className='border-t border-slate-200 dark:border-slate-700 pt-4'>
            <button
              type='button'
              onClick={() =>
                setIsTransportationExpanded(!isTransportationExpanded)
              }
              className='w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors'
            >
              <div className='flex items-center gap-2'>
                <span className='text-lg'>
                  {getTransportationIcon(form.watch("transportationMode"))}
                </span>
                <span className='text-sm font-medium text-slate-700 dark:text-slate-300'>
                  Transportation Details
                </span>
                {getTransportationSummary() && !isTransportationExpanded && (
                  <span className='text-xs text-slate-500 dark:text-slate-400 ml-2'>
                    ({getTransportationSummary()})
                  </span>
                )}
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                  isTransportationExpanded ? "rotate-180" : ""
                }`}
              />
            </button>

            {isTransportationExpanded && (
              <div className='mt-3 space-y-3 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-600'>
                {/* Transportation Mode */}
                <div>
                  <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                    Mode of Transportation
                  </label>
                  <select
                    value={form.watch("transportationMode") || ""}
                    onChange={(e) => {
                      const value =
                        e.target.value === ""
                          ? undefined
                          : (e.target
                              .value as (typeof transportationModes)[number]);
                      form.setValue("transportationMode", value, {
                        shouldValidate: true,
                      });
                    }}
                    onBlur={form.register("transportationMode").onBlur}
                    name='transportationMode'
                    ref={form.register("transportationMode").ref}
                    className='w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
                  >
                    <option value=''>Select mode...</option>
                    <option value='commute'>
                      🚌 Commute (Public Transport)
                    </option>
                    <option value='car'>🚗 Car (Private Vehicle)</option>
                    <option value='plane'>✈️ Plane (Air Travel)</option>
                    <option value='bus'>🚌 Bus</option>
                    <option value='train'>🚊 Train</option>
                    <option value='taxi'>🚕 Taxi/Rideshare</option>
                    <option value='walking'>🚶 Walking</option>
                    <option value='other'>Other</option>
                  </select>
                </div>

                {/* Pickup Time - only show for modes that need pickup */}
                {form.watch("transportationMode") &&
                  form.watch("transportationMode") !== "plane" &&
                  form.watch("transportationMode") !== "walking" && (
                    <div>
                      <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                        Pickup Time
                        <span className='text-xs text-slate-500 dark:text-slate-400 ml-1'>
                          (optional)
                        </span>
                      </label>
                      <Input
                        type='time'
                        {...form.register("pickupTime")}
                        className='w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
                        style={{ WebkitAppearance: "none", appearance: "none" }}
                      />
                    </div>
                  )}

                {/* Pickup Location - only show for modes that need pickup location */}
                {form.watch("transportationMode") &&
                  form.watch("transportationMode") !== "plane" &&
                  form.watch("transportationMode") !== "walking" && (
                    <div>
                      <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                        Pickup Location
                        <span className='text-xs text-slate-500 dark:text-slate-400 ml-1'>
                          (optional)
                        </span>
                      </label>
                      <input
                        type='text'
                        {...form.register("pickupLocation")}
                        placeholder='e.g., Hotel lobby, Bus station'
                        className='w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
                      />
                    </div>
                  )}

                {/* Dropoff Location - only show for modes that need dropoff location */}
                {form.watch("transportationMode") &&
                  form.watch("transportationMode") !== "plane" &&
                  form.watch("transportationMode") !== "walking" && (
                    <div>
                      <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                        Dropoff Location
                        <span className='text-xs text-slate-500 dark:text-slate-400 ml-1'>
                          (optional)
                        </span>
                      </label>
                      <input
                        type='text'
                        {...form.register("dropoffLocation")}
                        placeholder='e.g., Restaurant, Hotel'
                        className='w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
                      />
                    </div>
                  )}

                {/* Flight-specific fields (for plane) */}
                {form.watch("transportationMode") === "plane" && (
                  <div className='space-y-3 pt-2 border-t border-slate-200 dark:border-slate-600'>
                    <div>
                      <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                        Departure Airport
                        <span className='text-xs text-slate-500 dark:text-slate-400 ml-1'>
                          (optional)
                        </span>
                      </label>
                      <input
                        type='text'
                        {...form.register("pickupLocation")}
                        placeholder='e.g., NAIA Terminal 3'
                        className='w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                        Arrival Airport
                        <span className='text-xs text-slate-500 dark:text-slate-400 ml-1'>
                          (optional)
                        </span>
                      </label>
                      <input
                        type='text'
                        {...form.register("dropoffLocation")}
                        placeholder='e.g., Incheon International Airport'
                        className='w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                        Departure Time
                        <span className='text-xs text-slate-500 dark:text-slate-400 ml-1'>
                          (optional)
                        </span>
                      </label>
                      <Input
                        type='time'
                        {...form.register("pickupTime")}
                        className='w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
                        style={{ WebkitAppearance: "none", appearance: "none" }}
                      />
                    </div>
                  </div>
                )}

                {/* Clear Transportation Button */}
                {getTransportationSummary() && (
                  <button
                    type='button'
                    onClick={() => {
                      // Explicitly clear all transportation fields
                      // Use empty strings that will be converted to null on submit
                      form.setValue("transportationMode", undefined, {
                        shouldValidate: false,
                      });
                      form.setValue("pickupTime", "", {
                        shouldValidate: false,
                      });
                      form.setValue("pickupLocation", "", {
                        shouldValidate: false,
                      });
                      form.setValue("dropoffLocation", "", {
                        shouldValidate: false,
                      });
                      // Trigger validation after clearing to ensure form is valid
                      setTimeout(() => {
                        form.trigger([
                          "transportationMode",
                          "pickupTime",
                          "pickupLocation",
                          "dropoffLocation",
                        ]);
                      }, 0);
                    }}
                    className='w-full mt-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-red-200 dark:border-red-800'
                  >
                    Clear Transportation Info
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className='p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm'>
              {error}
            </div>
          )}

          {/* Form Validation Errors */}
          {form.formState.errors.title && (
            <div className='p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm'>
              {form.formState.errors.title.message}
            </div>
          )}
          {form.formState.errors.startTime && (
            <div className='p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm'>
              {form.formState.errors.startTime.message}
            </div>
          )}
          {form.formState.errors.pickupTime && (
            <div className='p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm'>
              {form.formState.errors.pickupTime.message}
            </div>
          )}

          {/* Buttons */}
          <div className='flex gap-3 pt-4'>
            <button
              type='button'
              onClick={onClose}
              disabled={isLoading}
              className='flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={isLoading}
              className='flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isLoading
                ? editingActivity
                  ? "Updating..."
                  : "Adding..."
                : editingActivity
                ? "Update Event"
                : "Add Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActivityModal;
