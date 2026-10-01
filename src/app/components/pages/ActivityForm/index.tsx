"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Car, Hotel, Loader2, Plane, Save, Ticket, Utensils } from "lucide-react";
import type { Activity, Trip } from "@/src/shared/types";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import NavigationLoader from "@/src/app/components/shared/NavigationLoader";
import { DetailsFields } from "./components/DetailsFields";
import { NotesAndActions } from "./components/NotesAndActions";
import { TransportFields } from "./components/TransportFields";
import { TypePicker } from "./components/TypePicker";
import { useActivityForm } from "./useActivityForm";
import type { ActivityType } from "./useActivityForm";

const STEP_TWO_HEADER: Record<ActivityType, { title: string; icon: typeof Ticket; iconBg: string }> = {
  flight: { title: "Add Flight Details", icon: Plane, iconBg: "bg-blue-500" },
  transport: { title: "Add Transport Details", icon: Car, iconBg: "bg-purple-500" },
  accommodation: { title: "Add Stay Details", icon: Hotel, iconBg: "bg-emerald-500" },
  general: { title: "New Activity", icon: Ticket, iconBg: "bg-orange-500" },
  food: { title: "New Activity", icon: Utensils, iconBg: "bg-orange-500" },
};

interface IActivityFormProps {
  mode: "add" | "edit";
  tripId: string;
  groupId: string;
  trip: Trip;
  /** Required in edit mode; ignored in add mode. */
  activity?: Activity;
  /** Add mode only: a date pre-filled from the calendar the user came from. */
  preSelectedDate?: Date | null;
  onSuccess: () => void;
}

/** The add/edit activity form: a type-picker wizard when adding, a single form when editing. */
const ActivityForm = ({ mode, tripId, groupId, trip, activity, preSelectedDate, onSuccess }: IActivityFormProps) => {
  const {
    form,
    error,
    currentStep,
    selectedType,
    availableDates,
    isNavigating,
    isSaving,
    handleTypeSelect,
    handleBackToType,
    handleSkipTransportation,
    onSubmit,
  } = useActivityForm({ mode, tripId, groupId, trip, activity, preSelectedDate, onSuccess });

  if (mode === "edit") {
    return (
      <div className='flex flex-col gap-6'>
        {isNavigating ? <NavigationLoader message='Updating activity...' /> : null}

        <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-6'>
          <DetailsFields form={form} availableDates={availableDates} selectedType={null} />
          <TransportFields mode='edit' form={form} onClear={handleSkipTransportation} />
          <NotesAndActions form={form} error={error} isSaving={isSaving} />
        </form>

        <div className='fixed bottom-6 right-6 z-50'>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSaving}
            className='flex size-14 items-center justify-center rounded-full p-0 shadow-lg transition-transform hover:scale-105 active:scale-95'
            title='Save Changes'
          >
            {isSaving ? <Loader2 className='size-6 animate-spin' /> : <Save className='size-6' />}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='w-full'>
      {isNavigating ? <NavigationLoader message='Adding activity...' /> : null}

      <AnimatePresence mode='wait'>
        {currentStep === 1 ? (
          <TypePicker key='step1' onSelect={handleTypeSelect} />
        ) : (
          <motion.div key='step2' initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.3 }}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <StepTwoHeader type={selectedType ?? "general"} />
              <DetailsFields form={form} availableDates={availableDates} selectedType={selectedType} />
              {selectedType === "flight" || selectedType === "transport" ? (
                <TransportFields mode='add' form={form} selectedType={selectedType} />
              ) : null}
              <NotesAndActions form={form} error={error} isSaving={isSaving} onBack={handleBackToType} />
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StepTwoHeader = ({ type }: { type: ActivityType }) => {
  const { title, icon: Icon, iconBg } = STEP_TWO_HEADER[type];
  return (
    <div className='mb-6 flex items-center gap-3'>
      <div className={cn("flex size-10 items-center justify-center rounded-full text-white shadow-lg", iconBg)}>
        <Icon className='size-5' />
      </div>
      <div>
        <h3 className='text-lg font-bold leading-tight text-white'>{title}</h3>
        <p className='text-xs text-slate-400'>Fill in the missing details</p>
      </div>
    </div>
  );
};

export default ActivityForm;
