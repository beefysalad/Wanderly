import type { Step } from "./onboardingOptions";

export const STEP_ORDER: Step[] = ["WELCOME", "IDENTITY", "DNA", "CREW", "TUTORIAL", "ACTION"];

const CONTINUE_LABELS: Partial<Record<Step, string>> = {
  IDENTITY: "Continue",
  DNA: "Next step",
  CREW: "Continue",
  TUTORIAL: "I'm ready",
};

/** 1-based position, for "Step N of 6". */
export const stepNumber = (step: Step) => STEP_ORDER.indexOf(step) + 1;

export const previousStep = (step: Step): Step | null => STEP_ORDER[STEP_ORDER.indexOf(step) - 1] ?? null;

export const nextStep = (step: Step): Step | null => STEP_ORDER[STEP_ORDER.indexOf(step) + 1] ?? null;

/** Welcome and the final choice carry their own buttons; the four steps between share the bottom bar. */
export const showsBottomBar = (step: Step) => step in CONTINUE_LABELS;

export const continueLabel = (step: Step) => CONTINUE_LABELS[step] ?? "Continue";

/** Identity, vibe and crew answers are saved as you go; the tour just moves on. */
export const savesProfile = (step: Step) => step === "IDENTITY" || step === "DNA" || step === "CREW";

interface ContinueState {
  isUploading: boolean;
  isSubmitting: boolean;
  vibeCount: number;
  crew: string;
}

export function canContinue(step: Step, state: ContinueState): boolean {
  if (state.isSubmitting) return false;
  if (step === "IDENTITY") return !state.isUploading;
  if (step === "DNA") return state.vibeCount > 0;
  if (step === "CREW") return !!state.crew;
  return true;
}
