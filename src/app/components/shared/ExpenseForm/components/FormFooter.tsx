import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { PILL } from "../../Pills";
import type { TExpenseSchema } from "../expenseSchema";
import { LAST_STEP } from "../steps";

interface IFormFooterProps {
  form: UseFormReturn<TExpenseSchema>;
  currentStep: number;
  isEditing: boolean;
  isSaving: boolean;
  handleBack: () => void;
  handleNext: () => void;
  onSubmit: (values: TExpenseSchema) => Promise<void>;
  onCancel: () => void;
}

/** Back (Cancel on the first step) and Continue (Save on the last). */
export const FormFooter = ({ form, currentStep, isEditing, isSaving, handleBack, handleNext, onSubmit, onCancel }: IFormFooterProps) => {
  const last = currentStep === LAST_STEP;

  return (
    <div className='flex items-center justify-between gap-3 pt-2'>
      <button type='button' onClick={currentStep === 1 ? onCancel : handleBack} className={PILL.ghost}>
        {currentStep > 1 ? <ArrowLeft className='size-[17px]' /> : null}
        {currentStep === 1 ? "Cancel" : "Back"}
      </button>
      <button
        type='button'
        disabled={isSaving}
        onClick={last ? form.handleSubmit(onSubmit) : handleNext}
        className='inline-flex cursor-pointer items-center gap-[10px] rounded-full bg-[linear-gradient(100deg,#fbbf24,#f97316)] px-6 py-[13px] text-[15px] font-extrabold text-[#160c02] shadow-[0_18px_40px_-18px_rgba(251,146,60,.9)] disabled:cursor-not-allowed disabled:opacity-60'
      >
        {isSaving ? (
          <>
            <Loader2 className='size-[18px] animate-spin' /> Saving…
          </>
        ) : last ? (
          isEditing ? "Save changes" : "Save expense"
        ) : (
          <>
            Continue <ArrowRight className='size-[18px]' />
          </>
        )}
      </button>
    </div>
  );
};
