"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import type { User } from "@/src/shared/types";
import { GridBackdrop } from "../../../shared/Site/GridBackdrop";
import { EASE } from "../../../shared/Site/motion";
import { ActionStep } from "./components/ActionStep";
import { CrewStep } from "./components/CrewStep";
import { DnaStep } from "./components/DnaStep";
import { IdentityStep } from "./components/IdentityStep";
import { TutorialStep } from "./components/TutorialStep";
import { WelcomeStep } from "./components/WelcomeStep";
import { WizardBottomBar } from "./components/WizardBottomBar";
import { WizardTopBar } from "./components/WizardTopBar";
import { showsBottomBar } from "./onboardingSteps";
import { useOnboardingWizard } from "./useOnboardingWizard";

interface OnboardingWizardProps {
  user: User;
  onComplete: () => void;
}

const OnboardingWizard = ({ user, onComplete }: OnboardingWizardProps) => {
  const wizard = useOnboardingWizard(user, onComplete);
  const { step } = wizard;
  const scroller = useRef<HTMLDivElement>(null);
  const firstName = (wizard.displayName || user.name || "").trim().split(" ")[0] || "traveler";

  // A new step starts at the top, as it would on a fresh page.
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [step]);

  return (
    <div className='fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#020617] font-[family-name:var(--font-geist-sans)] leading-[normal] text-[#f8fafc]'>
      <GridBackdrop position='absolute' />
      <WizardTopBar step={step} />

      <div ref={scroller} className='@container relative z-[1] min-h-0 flex-1 overflow-y-auto [scrollbar-width:none]'>
        <div className='flex min-h-full flex-col justify-center px-[clamp(20px,5cqw,64px)] py-[clamp(28px,5cqw,56px)]'>
          <AnimatePresence mode='wait'>
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              {step === "WELCOME" && (
                <WelcomeStep firstName={firstName} onBegin={() => wizard.setStep("IDENTITY")} />
              )}
              {step === "IDENTITY" && (
                <IdentityStep
                  displayName={wizard.displayName}
                  imageUrl={wizard.imageUrl}
                  bucketList={wizard.bucketList}
                  setBucketList={wizard.setBucketList}
                  uploadError={wizard.uploadError}
                  isUploading={wizard.isUploading}
                  handleImageUpload={wizard.handleImageUpload}
                  fileInputRef={wizard.fileInputRef}
                />
              )}
              {step === "DNA" && <DnaStep selectedVibes={wizard.selectedVibes} toggleVibe={wizard.toggleVibe} />}
              {step === "CREW" && (
                <CrewStep selectedCrew={wizard.selectedCrew} setSelectedCrew={wizard.setSelectedCrew} />
              )}
              {step === "TUTORIAL" && <TutorialStep />}
              {step === "ACTION" && (
                <ActionStep
                  handleCompleteOnboarding={wizard.handleCompleteOnboarding}
                  isSubmitting={wizard.isSubmitting}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {showsBottomBar(step) ? (
        <WizardBottomBar
          step={step}
          enabled={wizard.continueEnabled}
          isSubmitting={wizard.isSubmitting}
          onBack={wizard.goBack}
          onContinue={wizard.proceed}
        />
      ) : null}
    </div>
  );
};

export default OnboardingWizard;
