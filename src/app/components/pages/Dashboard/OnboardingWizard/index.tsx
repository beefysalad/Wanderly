"use client";

import { User } from "@/src/shared/types";
import { AnimatePresence } from "framer-motion";
import PremiumBackground from "../../../shared/PremiumBackground";
import { ActionStep } from "./components/ActionStep";
import { CrewStep } from "./components/CrewStep";
import { DnaStep } from "./components/DnaStep";
import { IdentityStep } from "./components/IdentityStep";
import { ProgressDots } from "./components/ProgressDots";
import { TutorialStep } from "./components/TutorialStep";
import { WelcomeStep } from "./components/WelcomeStep";
import { useOnboardingWizard } from "./useOnboardingWizard";

interface OnboardingWizardProps {
  user: User;
  onComplete: () => void;
}

const OnboardingWizard = ({ user, onComplete }: OnboardingWizardProps) => {
  const wizard = useOnboardingWizard(user, onComplete);
  const { step } = wizard;

  return (
    <div className='fixed inset-0 z-50 flex flex-col bg-slate-950 text-white font-sans overflow-hidden'>
      {/* Dynamic Background */}
      <PremiumBackground />

      {/* Content Container - Scrollable */}
      <div className='relative z-10 w-full h-full overflow-y-auto'>
        <div className='min-h-full flex flex-col items-center justify-center p-4 pb-24'>
          <div className='w-full max-w-5xl'>
            <AnimatePresence mode='wait'>
              {step === "WELCOME" && <WelcomeStep setStep={wizard.setStep} />}
              {step === "IDENTITY" && (
                <IdentityStep
                  displayName={wizard.displayName}
                  imageUrl={wizard.imageUrl}
                  bucketList={wizard.bucketList}
                  setBucketList={wizard.setBucketList}
                  uploadError={wizard.uploadError}
                  isUploading={wizard.isUploading}
                  handleImageUpload={wizard.handleImageUpload}
                  handleUpdateProfile={wizard.handleUpdateProfile}
                  isSubmitting={wizard.isSubmitting}
                  fileInputRef={wizard.fileInputRef}
                />
              )}
              {step === "DNA" && (
                <DnaStep
                  selectedVibes={wizard.selectedVibes}
                  toggleVibe={wizard.toggleVibe}
                  handleUpdateProfile={wizard.handleUpdateProfile}
                />
              )}
              {step === "CREW" && (
                <CrewStep
                  selectedCrew={wizard.selectedCrew}
                  setSelectedCrew={wizard.setSelectedCrew}
                  handleUpdateProfile={wizard.handleUpdateProfile}
                />
              )}
              {step === "TUTORIAL" && <TutorialStep setStep={wizard.setStep} />}
              {step === "ACTION" && (
                <ActionStep handleCompleteOnboarding={wizard.handleCompleteOnboarding} />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Progress Indicator (Bottom) */}
      <ProgressDots step={step} />
    </div>
  );
};

export default OnboardingWizard;
