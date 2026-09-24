import { CheckCircle } from "lucide-react";
import React from "react";
import type { ExpenseFormStep } from "../steps";

interface IStepperProps {
  steps: ExpenseFormStep[];
  currentStep: number;
  cleanMode: boolean;
}

export const Stepper = ({ steps, currentStep, cleanMode }: IStepperProps) => {
  return (
    <div
      className={
        cleanMode ? "py-6" : "py-6 bg-slate-900/50 border-b border-white/5"
      }
    >
      <div className='flex items-center justify-center relative px-4'>
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={step.number}>
              <div className='flex items-center justify-center flex-1 relative'>
                {/* Step Circle */}
                <div className='flex flex-col items-center gap-2 flex-shrink-0 z-10'>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200 z-10 relative ${
                      isCompleted
                        ? "bg-orange-500 border-orange-500 text-white"
                        : isActive
                          ? "bg-slate-950 border-orange-500 text-orange-400"
                          : "bg-slate-950 border-slate-600 text-slate-400"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className='w-5 h-5' />
                    ) : (
                      <StepIcon className='w-5 h-5' />
                    )}
                  </div>
                  <div className='text-center hidden sm:block'>
                    <p
                      className={`text-xs font-semibold ${
                        isActive ? "text-white" : "text-slate-400"
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>
                </div>
                {/* Connector Line */}
                {!isLast && (
                  <div
                    className={`absolute left-[50%] right-0 h-0.5 top-[20px] transition-all duration-200 ${
                      isCompleted ? "bg-orange-500" : "bg-slate-700"
                    }`}
                    style={{ width: "calc(100% - 2.5rem)" }}
                  />
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
