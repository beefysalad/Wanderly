import { MapPin, Navigation, Trash2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { cn } from "@/src/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { FIELD_LABEL, INPUT } from "@/src/app/components/shared/formStyles";
import type { TActivitySchema } from "../activitySchema";
import type { ActivityType } from "../useActivityForm";

interface IAddTransportFieldsProps {
  mode: "add";
  form: UseFormReturn<TActivitySchema>;
  selectedType: ActivityType;
}

interface IEditTransportFieldsProps {
  mode: "edit";
  form: UseFormReturn<TActivitySchema>;
  onClear: () => void;
}

type ITransportFieldsProps = IAddTransportFieldsProps | IEditTransportFieldsProps;

/**
 * Transportation details. Add mode only shows this once a flight/transport type is picked, and just
 * asks for pickup/dropoff. Edit mode always shows it, lets you pick (or clear) any mode, and asks
 * for the fields that mode needs.
 */
export const TransportFields = (props: ITransportFieldsProps) => {
  if (props.mode === "add") return <AddTransportFields form={props.form} selectedType={props.selectedType} />;
  return <EditTransportFields form={props.form} onClear={props.onClear} />;
};

const AddTransportFields = ({ form, selectedType }: { form: UseFormReturn<TActivitySchema>; selectedType: ActivityType }) => {
  const isFlight = selectedType === "flight";

  return (
    <div className='space-y-4 pt-4 border-t border-white/5'>
      <div className='grid grid-cols-2 gap-4'>
        <label className='flex flex-col gap-[7px]'>
          <span className={FIELD_LABEL}>{isFlight ? "Dep Airport" : "Pickup / From"}</span>
          <div className='relative'>
            <input type='text' {...form.register("pickupLocation")} placeholder={isFlight ? "MNL" : "Station/Location"} className={INPUT} />
            <MapPin className='pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500' />
          </div>
        </label>
        <label className='flex flex-col gap-[7px]'>
          <span className={FIELD_LABEL}>{isFlight ? "Arr Airport" : "Dropoff / To"}</span>
          <div className='relative'>
            <input type='text' {...form.register("dropoffLocation")} placeholder={isFlight ? "NRT" : "Station/Location"} className={INPUT} />
            <MapPin className='pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500' />
          </div>
        </label>
      </div>
    </div>
  );
};

const EditTransportFields = ({ form, onClear }: { form: UseFormReturn<TActivitySchema>; onClear: () => void }) => {
  const transportationMode = form.watch("transportationMode");

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <span className={cn(FIELD_LABEL, "flex items-center gap-2")}>
          <Navigation className='size-4 text-emerald-500' />
          Transportation
        </span>
        {transportationMode ? (
          <button type='button' onClick={onClear} className='flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-300'>
            <Trash2 className='size-3' />
            Clear
          </button>
        ) : null}
      </div>

      <div className='flex flex-col gap-[7px]'>
        <span className={FIELD_LABEL}>Mode</span>
        <Select
          value={transportationMode || ""}
          onValueChange={(value) => {
            const modeValue = value === "" || value === "none" ? undefined : (value as TActivitySchema["transportationMode"]);
            form.setValue("transportationMode", modeValue, { shouldValidate: false });
          }}
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Select transportation mode...' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='none'>None (No travel needed)</SelectItem>
            <SelectItem value='commute'>🚌 Commute</SelectItem>
            <SelectItem value='car'>🚗 Car</SelectItem>
            <SelectItem value='plane'>✈️ Plane</SelectItem>
            <SelectItem value='bus'>🚌 Bus</SelectItem>
            <SelectItem value='train'>🚊 Train</SelectItem>
            <SelectItem value='taxi'>🚕 Taxi/Rideshare</SelectItem>
            <SelectItem value='walking'>🚶 Walking</SelectItem>
            <SelectItem value='other'>Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {transportationMode ? (
        <div className='space-y-4 border-t border-white/[.08] pt-4'>
          {transportationMode === "plane" ? (
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <label className='flex flex-col gap-[7px]'>
                <span className={FIELD_LABEL}>Departure Airport</span>
                <input type='text' {...form.register("pickupLocation")} placeholder='e.g. JFK' className={INPUT} />
              </label>
              <label className='flex flex-col gap-[7px]'>
                <span className={FIELD_LABEL}>Arrival Airport</span>
                <input type='text' {...form.register("dropoffLocation")} placeholder='e.g. LHR' className={INPUT} />
              </label>
              <label className='flex flex-col gap-[7px]'>
                <span className={FIELD_LABEL}>Departure Time</span>
                <input type='time' {...form.register("pickupTime")} className={cn(INPUT, "appearance-none")} />
              </label>
            </div>
          ) : transportationMode !== "walking" ? (
            <>
              <label className='flex flex-col gap-[7px]'>
                <span className={FIELD_LABEL}>Pickup Time</span>
                <input type='time' {...form.register("pickupTime")} className={cn(INPUT, "appearance-none")} />
              </label>
              <label className='flex flex-col gap-[7px]'>
                <span className={FIELD_LABEL}>Pickup Location</span>
                <div className='relative'>
                  <input type='text' {...form.register("pickupLocation")} placeholder='e.g. Hotel Lobby' className={INPUT} />
                  <MapPin className='pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500' />
                </div>
              </label>
              <label className='flex flex-col gap-[7px]'>
                <span className={FIELD_LABEL}>Dropoff Location</span>
                <div className='relative'>
                  <input type='text' {...form.register("dropoffLocation")} placeholder='e.g. Activity Site' className={INPUT} />
                  <MapPin className='pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500' />
                </div>
              </label>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
