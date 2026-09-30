import { Calendar, Clock, MapPin } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { cn } from "@/src/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { FIELD_ERROR, FIELD_LABEL, INPUT } from "@/src/app/components/shared/formStyles";
import type { TActivitySchema } from "../activitySchema";
import type { ActivityType } from "../useActivityForm";

interface IDetailsFieldsProps {
  form: UseFormReturn<TActivitySchema>;
  availableDates: Date[];
  /** The type picked in add mode; always `null` in edit mode (edit never re-picks a type). */
  selectedType: ActivityType | null;
}

const titleLabel = (selectedType: ActivityType | null) => {
  if (selectedType === "flight") return "Flight Number / Airline";
  if (selectedType === "accommodation") return "Hotel Name";
  return "Activity Title";
};

const titlePlaceholder = (selectedType: ActivityType | null) => {
  if (selectedType === "flight") return "e.g. PR 2808 or PAL Flight";
  if (selectedType === "transport") return "e.g. Bus to Baguio";
  return "e.g. Visit Louvre Museum";
};

/** Title, location, date and start/end time — the fields every activity has regardless of type. */
export const DetailsFields = ({ form, availableDates, selectedType }: IDetailsFieldsProps) => {
  const errors = form.formState.errors;
  const showQuickTransportMode = selectedType === "transport";

  return (
    <div className='space-y-4'>
      <label className='flex flex-col gap-[7px]'>
        <span className={FIELD_LABEL}>{titleLabel(selectedType)}</span>
        <input type='text' {...form.register("title")} placeholder={titlePlaceholder(selectedType)} className={INPUT} autoFocus />
        {errors.title ? <span className={FIELD_ERROR}>{errors.title.message}</span> : null}
      </label>

      <label className='flex flex-col gap-[7px]'>
        <span className={FIELD_LABEL}>Location</span>
        <div className='relative'>
          <input type='text' {...form.register("location")} placeholder='e.g. Louvre Museum, Paris' maxLength={200} className={INPUT} />
          <MapPin className='pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500' />
        </div>
        {errors.location ? <span className={FIELD_ERROR}>{errors.location.message}</span> : null}
      </label>

      <div className={cn("grid gap-4", showQuickTransportMode ? "grid-cols-2" : "grid-cols-1")}>
        <label className='flex flex-col gap-[7px]'>
          <span className={FIELD_LABEL}>Date</span>
          <div className='relative'>
            <select {...form.register("date")} className={cn(INPUT, "cursor-pointer appearance-none")}>
              {availableDates.map((d) => (
                <option key={d.toISOString()} value={d.toISOString().split("T")[0]} className='bg-slate-900 text-white'>
                  {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </option>
              ))}
            </select>
            <Calendar className='pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500' />
          </div>
          {errors.date ? <span className={FIELD_ERROR}>{errors.date.message}</span> : null}
        </label>

        {showQuickTransportMode ? (
          <div className='flex flex-col gap-[7px]'>
            <span className={FIELD_LABEL}>Mode</span>
            <Select
              value={form.watch("transportationMode") || ""}
              onValueChange={(value) => form.setValue("transportationMode", value === "" ? undefined : (value as TActivitySchema["transportationMode"]))}
            >
              <SelectTrigger className='h-[46px] w-full'>
                <SelectValue placeholder='Select...' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='car'>🚗 Car</SelectItem>
                <SelectItem value='bus'>🚌 Bus</SelectItem>
                <SelectItem value='train'>🚊 Train</SelectItem>
                <SelectItem value='taxi'>🚕 Taxi</SelectItem>
                <SelectItem value='walking'>🚶 Walking</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <label className='flex flex-col gap-[7px]'>
          <span className={FIELD_LABEL}>{selectedType === "flight" ? "Departure Time" : "Start Time"}</span>
          <div className='relative'>
            <input type='time' {...form.register("startTime")} className={cn(INPUT, "appearance-none")} />
            <Clock className='pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500' />
          </div>
          {errors.startTime ? <span className={FIELD_ERROR}>{errors.startTime.message}</span> : null}
        </label>
        <label className='flex flex-col gap-[7px]'>
          <span className={FIELD_LABEL}>{selectedType === "flight" ? "Arrival Time" : "End Time"}</span>
          <div className='relative'>
            <input type='time' {...form.register("endTime")} className={cn(INPUT, "appearance-none")} />
            <Clock className='pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500' />
          </div>
          {errors.endTime ? <span className={FIELD_ERROR}>{errors.endTime.message}</span> : null}
        </label>
      </div>
    </div>
  );
};
