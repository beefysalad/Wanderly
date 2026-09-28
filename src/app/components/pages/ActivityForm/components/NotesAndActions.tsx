import { cn } from "@/lib/utils";
import type { UseFormReturn } from "react-hook-form";
import { FIELD_LABEL, INPUT, SUBMIT_BUTTON } from "@/src/app/components/shared/formStyles";
import type { TActivitySchema } from "../activitySchema";

interface INotesAndActionsProps {
  form: UseFormReturn<TActivitySchema>;
  error: string | null;
  isSaving: boolean;
  /** Add mode only: goes back to the type picker. Omit to hide the back button (edit mode). */
  onBack?: () => void;
}

/** The notes field, the error banner, and — in add mode — the back/submit buttons for the wizard. */
export const NotesAndActions = ({ form, error, isSaving, onBack }: INotesAndActionsProps) => {
  return (
    <div className='space-y-6'>
      <label className='flex flex-col gap-[7px]'>
        <span className={FIELD_LABEL}>Notes</span>
        <textarea
          {...form.register("notes")}
          placeholder='Add reservation numbers, gate info, or packing notes...'
          rows={4}
          className={cn(INPUT, "resize-none")}
        />
      </label>

      {error ? <div className='rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm font-medium text-red-400'>{error}</div> : null}

      {onBack ? (
        <div className='flex gap-3 pt-2'>
          <button
            type='button'
            onClick={onBack}
            className='rounded-xl border border-white/10 px-5 py-3 font-medium text-slate-400 transition-all hover:bg-white/5 hover:text-white'
          >
            Back
          </button>
          <button type='submit' disabled={isSaving} className={cn(SUBMIT_BUTTON, "flex-1")}>
            {isSaving ? "Saving..." : "Create Activity"}
          </button>
        </div>
      ) : null}
    </div>
  );
};
