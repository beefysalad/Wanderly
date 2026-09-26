"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import type { Activity, Expense } from "@/src/shared/types";
import { EASE } from "../Site/motion";
import { sortActivities } from "./activityOptions";
import { DetailsStep } from "./components/DetailsStep";
import { FormFooter } from "./components/FormFooter";
import { PaymentStep } from "./components/PaymentStep";
import { QrImageModal } from "./components/QrImageModal";
import { SplitStep } from "./components/SplitStep";
import { Stepper } from "./components/Stepper";
import { EXPENSE_FORM_STEPS } from "./steps";
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
}

/** The three-step add/edit expense form: details, split, payment. The page around it supplies the chrome. */
const ExpenseForm = ({ tripId, groupId, members, memberNames, activities = [], onSuccess, onCancel, initialData }: IExpenseFormProps) => {
  const getDisplayName = (email: string): string => memberNames?.[email] || email.split("@")[0];

  const [showImageModal, setShowImageModal] = useState(false);
  const [isPaidByGuest, setIsPaidByGuest] = useState(false);
  const [guestName, setGuestName] = useState("");

  const { form, currentStep, isSaving, handleNext, handleBack, onSubmit, toggleMember, toggleSelectAll } = useExpenseForm({
    tripId,
    groupId,
    members,
    initialData,
    onSuccess,
  });
  const { uploadingImage, uploadError, handleImageUpload } = useQrImageUpload(form);
  const sortedActivities = useMemo(() => sortActivities(activities), [activities]);

  const goTo = (step: number) => {
    for (let i = currentStep; i > step; i--) handleBack();
  };

  return (
    <div className='flex flex-col gap-[22px]'>
      <Stepper steps={EXPENSE_FORM_STEPS} currentStep={currentStep} onGoTo={goTo} />

      <form className='flex flex-col gap-[22px]' onSubmit={(event) => event.preventDefault()}>
        <AnimatePresence mode='wait' initial={false}>
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: EASE }}
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
                paidByName={getDisplayName(form.watch("paidBy"))}
              />
            )}
          </motion.div>
        </AnimatePresence>

        <FormFooter
          form={form}
          currentStep={currentStep}
          isEditing={!!initialData}
          isSaving={isSaving}
          handleBack={handleBack}
          handleNext={handleNext}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      </form>

      {showImageModal && form.watch("qrImage") ? (
        <QrImageModal src={form.watch("qrImage") || ""} onClose={() => setShowImageModal(false)} />
      ) : null}
    </div>
  );
};

export default ExpenseForm;
