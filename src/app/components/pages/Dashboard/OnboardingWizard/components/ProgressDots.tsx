import type { Step } from "../onboardingOptions";

interface IProgressDotsProps {
  step: Step;
}

export const ProgressDots = ({ step }: IProgressDotsProps) => {
  return (
    <div className='fixed bottom-8 left-0 right-0 flex justify-center gap-2 z-20'>
      {["WELCOME", "IDENTITY", "DNA", "CREW", "TUTORIAL", "ACTION"].map(
        (s, i) => {
          const currentIndex = [
            "WELCOME",
            "IDENTITY",
            "DNA",
            "CREW",
            "TUTORIAL",
            "ACTION",
          ].indexOf(step);
          return (
            <div
              key={s}
              className={`h-1 rounded-full transition-all duration-500 ${
                i <= currentIndex ? "w-8 bg-amber-500" : "w-2 bg-slate-700"
              }`}
            />
          );
        },
      )}
    </div>
  );
};
