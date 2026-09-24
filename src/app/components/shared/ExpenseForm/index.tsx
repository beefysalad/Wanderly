"use client";

import { Expense, Activity } from "@/src/shared/types";
import React, { useMemo, useState } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { sortActivities } from "./activityOptions";
import { DetailsStep } from "./components/DetailsStep";
import { FormFooter } from "./components/FormFooter";
import { PaymentStep } from "./components/PaymentStep";
import { QrImageModal } from "./components/QrImageModal";
import { SplitStep } from "./components/SplitStep";
import { Stepper } from "./components/Stepper";
import { EXPENSE_FORM_STEPS, STEP_VARIANTS } from "./steps";
import { useExpenseForm } from "./useExpenseForm";
import { useQrImageUpload } from "./useQrImageUpload";

interface IExpenseFormProps {
  tripId: string;
  groupId: string;
  members: string[];
  memberNames?: Record<string, string>;
  activities?: Activity[];
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Expense;
  hideHeader?: boolean;
  cleanMode?: boolean;
}

const ExpenseForm = ({
  tripId,
  groupId,
  members,
  memberNames,
  activities = [],
  onSuccess,
  onCancel,
  initialData,
  hideHeader = false,
  cleanMode = false,
}: IExpenseFormProps) => {
  const getDisplayName = (email: string): string => {
    return memberNames?.[email] || email.split("@")[0];
  };

  const [showImageModal, setShowImageModal] = useState(false);
  const [isPaidByGuest, setIsPaidByGuest] = useState(false);
  const [guestName, setGuestName] = useState("");

  const {
    form,
    currentStep,
    direction,
    isSaving,
    handleNext,
    handleBack,
    onSubmit,
    toggleMember,
    toggleSelectAll,
  } = useExpenseForm({ tripId, groupId, members, initialData, onSuccess });

  const { uploadingImage, uploadError, handleImageUpload } = useQrImageUpload(form);

  const sortedActivities = useMemo(() => sortActivities(activities), [activities]);

  const steps = EXPENSE_FORM_STEPS;

  return (
    <div
      className={
        cleanMode
          ? "h-full flex flex-col"
          : "flex flex-col h-full bg-slate-900 text-white rounded-3xl overflow-hidden border border-white/5 shadow-2xl"
      }
    >
      {/* Header */}
      {!hideHeader && (
        <div className='px-6 py-5 border-b border-white/5 flex items-center justify-between bg-slate-900/50 backdrop-blur-xl z-20'>
          <div>
            <h2 className='text-xl font-bold text-white'>
              {initialData ? "Edit Expense" : "Add New Expense"}
            </h2>
            <p className='text-xs text-slate-400'>
              Step {currentStep} of {steps.length}:{" "}
              {steps[currentStep - 1].title}
            </p>
          </div>
          <button
            onClick={onCancel}
            className='p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors'
          >
            <X className='w-5 h-5' />
          </button>
        </div>
      )}

      <Stepper steps={steps} currentStep={currentStep} cleanMode={cleanMode} />

      {/* Form Content */}
      <div className='flex-1 overflow-hidden relative'>
        <form
          className='h-full flex flex-col'
          onSubmit={(e) => e.preventDefault()}
        >
          <div className='flex-1 overflow-y-auto p-6 scrollbar-hide'>
            <AnimatePresence initial={false} custom={direction} mode='wait'>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={STEP_VARIANTS}
                initial='enter'
                animate='center'
                exit='exit'
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className='space-y-6'
              >
                {currentStep === 1 && (
                  <DetailsStep
                    form={form}
                    members={members}
                    getDisplayName={getDisplayName}
                    sortedActivities={sortedActivities}
                    isPaidByGuest={isPaidByGuest}
                    setIsPaidByGuest={setIsPaidByGuest}
                  />
                )}
                {currentStep === 2 && (
                  <SplitStep
                    form={form}
                    members={members}
                    getDisplayName={getDisplayName}
                    toggleMember={toggleMember}
                    toggleSelectAll={toggleSelectAll}
                    guestName={guestName}
                    setGuestName={setGuestName}
                  />
                )}
                {currentStep === 3 && (
                  <PaymentStep
                    form={form}
                    uploadingImage={uploadingImage}
                    uploadError={uploadError}
                    handleImageUpload={handleImageUpload}
                    setShowImageModal={setShowImageModal}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <FormFooter
            form={form}
            currentStep={currentStep}
            cleanMode={cleanMode}
            isEditing={!!initialData}
            isSaving={isSaving}
            handleBack={handleBack}
            handleNext={handleNext}
            onSubmit={onSubmit}
          />
        </form>
      </div>

      {showImageModal && form.watch("qrImage") && (
        <QrImageModal
          src={form.watch("qrImage") || ""}
          onClose={() => setShowImageModal(false)}
        />
      )}
    </div>
  );
};

export default ExpenseForm;
