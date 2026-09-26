import { cn } from "@/lib/utils";
import { CHIP, CHIP_OFF, CHIP_ON, FIELD_ERROR, FIELD_LABEL, INPUT } from "../../formStyles";
import type { UseFormReturn } from "react-hook-form";
import type { Activity } from "@/src/shared/types";
import { formatActivityDisplay } from "../activityOptions";
import type { TExpenseSchema } from "../expenseSchema";

// The stored values are the lowercase ones; the dot is the category's colour.
const CATEGORIES = [
  { value: "food", label: "Food", dot: "bg-[#fb923c]" },
  { value: "accommodation", label: "Accommodation", dot: "bg-[#38bdf8]" },
  { value: "transport", label: "Transport", dot: "bg-[#a78bfa]" },
  { value: "activities", label: "Activities", dot: "bg-[#fbbf24]" },
  { value: "other", label: "Other", dot: "bg-[#94a3b8]" },
];

interface IDetailsStepProps {
  form: UseFormReturn<TExpenseSchema>;
  members: string[];
  getDisplayName: (email: string) => string;
  sortedActivities: Activity[];
  isPaidByGuest: boolean;
  setIsPaidByGuest: (value: boolean) => void;
}

/** Step 1: the amount, what it was for, its category, the date, who paid and an optional linked activity. */
export const DetailsStep = ({ form, members, getDisplayName, sortedActivities, isPaidByGuest, setIsPaidByGuest }: IDetailsStepProps) => {
  const errors = form.formState.errors;
  const category = form.watch("category");

  return (
    <div className='flex flex-col gap-[18px]'>
      <label className='flex flex-col gap-[7px]'>
        <span className={FIELD_LABEL}>Amount</span>
        <span className='flex items-center gap-[6px] rounded-2xl border border-white/[.1] bg-[rgba(15,23,42,.6)] px-[18px] py-[10px] focus-within:border-[rgba(251,191,36,.55)] focus-within:shadow-[0_0_0_3px_rgba(251,191,36,.12)]'>
          <span className='text-[34px] font-extrabold text-[#64748b]'>₱</span>
          <input
            type='number'
            step='0.01'
            inputMode='decimal'
            {...form.register("amount")}
            placeholder='0'
            autoFocus
            className='min-w-0 flex-1 border-0 bg-transparent text-[40px] font-extrabold tabular-nums text-[#fbbf24] outline-none placeholder:text-[#475569]'
          />
        </span>
        {errors.amount ? <span className={FIELD_ERROR}>{errors.amount.message}</span> : null}
      </label>

      <label className='flex flex-col gap-[7px]'>
        <span className={FIELD_LABEL}>What was it for?</span>
        <input type='text' {...form.register("description")} placeholder='e.g. Tricycle to Cloud 9' className={INPUT} />
        {errors.description ? <span className={FIELD_ERROR}>{errors.description.message}</span> : null}
      </label>

      <div className='flex flex-col gap-[9px]'>
        <span className={FIELD_LABEL}>Category</span>
        <div className='flex flex-wrap gap-2'>
          {CATEGORIES.map((item) => (
            <button
              key={item.value}
              type='button'
              aria-pressed={category === item.value}
              onClick={() => form.setValue("category", item.value, { shouldValidate: true })}
              className={cn(CHIP, category === item.value ? CHIP_ON : CHIP_OFF)}
            >
              <span className={cn("size-2 rounded-full", item.dot)} />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className='grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-4'>
        <label className='flex flex-col gap-[7px]'>
          <span className={FIELD_LABEL}>Date</span>
          <input type='date' {...form.register("date")} className={cn(INPUT, "[color-scheme:dark]")} />
          {errors.date ? <span className={FIELD_ERROR}>{errors.date.message}</span> : null}
        </label>

        <div className='flex flex-col gap-[7px]'>
          <span className='flex items-center justify-between'>
            <label htmlFor='paidBy' className={FIELD_LABEL}>
              Paid by
            </label>
            <button
              type='button'
              onClick={() => {
                setIsPaidByGuest(!isPaidByGuest);
                form.setValue("paidBy", members[0] || "");
              }}
              className='cursor-pointer text-xs font-semibold text-[#fbbf24] hover:text-[#fcd34d]'
            >
              {isPaidByGuest ? "Pick a member" : "Enter a guest name"}
            </button>
          </span>
          {isPaidByGuest ? (
            <input id='paidBy' type='text' {...form.register("paidBy")} placeholder='Guest name' className={INPUT} />
          ) : (
            <select id='paidBy' {...form.register("paidBy")} className={cn(INPUT, "cursor-pointer")}>
              {members.map((member) => (
                <option key={member} value={member}>
                  {getDisplayName(member)}
                </option>
              ))}
            </select>
          )}
          {errors.paidBy ? <span className={FIELD_ERROR}>{errors.paidBy.message}</span> : null}
        </div>
      </div>

      {sortedActivities.length > 0 ? (
        <label className='flex flex-col gap-[7px]'>
          <span className={cn(FIELD_LABEL, "flex items-center gap-2")}>
            Link to activity
            <span className='rounded bg-white/[.06] px-[6px] py-[2px] text-[10px] text-[#64748b]'>Optional</span>
          </span>
          <select {...form.register("activityId")} className={cn(INPUT, "cursor-pointer")}>
            <option value=''>No activity linked</option>
            {sortedActivities.map((activity) => (
              <option key={activity.id} value={activity.id}>
                {formatActivityDisplay(activity)}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
};
