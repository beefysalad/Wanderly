import { CheckCircle, ChevronRight, Loader2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { TExpenseSchema } from "../expenseSchema";

interface IFormFooterProps {
  form: UseFormReturn<TExpenseSchema>;
  currentStep: number;
  cleanMode: boolean;
  isEditing: boolean;
  isSaving: boolean;
  handleBack: () => void;
  handleNext: () => void;
  onSubmit: (values: TExpenseSchema) => Promise<void>;
}

export const FormFooter = ({
  form,
  currentStep,
  cleanMode,
  isEditing,
  isSaving,
  handleBack,
  handleNext,
  onSubmit,
}: IFormFooterProps) => {
  return (
    <div
      className={
        cleanMode
          ? "p-6 flex justify-between items-center z-20"
          : "p-6 border-t border-white/5 bg-slate-900/50 backdrop-blur-xl flex justify-between items-center z-20"
      }
    >
      <button
        type='button'
        onClick={handleBack}
        disabled={currentStep === 1}
        className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
          currentStep === 1
            ? "opacity-0 pointer-events-none"
            : "text-slate-400 hover:text-white hover:bg-white/5"
        }`}
      >
        Back
      </button>

      {currentStep < 3 ? (
        <button
          type='button'
          onClick={handleNext}
          className='px-6 py-2.5 bg-white text-slate-900 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all flex items-center gap-2 shadow-lg shadow-white/5'
        >
          Next Step
          <ChevronRight className='w-4 h-4' />
        </button>
      ) : (
        <button
          type='button'
          onClick={form.handleSubmit(onSubmit)}
          disabled={
            isSaving
          }
          className='px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-sm font-bold hover:from-orange-400 hover:to-amber-400 transition-all flex items-center gap-2 shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {isSaving ? (
            <>
              <Loader2 className='w-4 h-4 animate-spin' />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className='w-4 h-4' />
              {isEditing ? "Update Expense" : "Create Expense"}
            </>
          )}
        </button>
      )}
    </div>
  );
};
