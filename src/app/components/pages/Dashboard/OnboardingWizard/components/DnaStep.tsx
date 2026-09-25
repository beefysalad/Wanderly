import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { VIBES } from "../onboardingOptions";
import type { Step } from "../onboardingOptions";

interface IDnaStepProps {
  selectedVibes: string[];
  toggleVibe: (id: string) => void;
  handleUpdateProfile: (nextStep: Step) => void;
}

export const DnaStep = ({ selectedVibes, toggleVibe, handleUpdateProfile }: IDnaStepProps) => {
  return (
    <motion.div
      key='dna'
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className='max-w-4xl mx-auto'
    >
      <div className='text-center mb-6 md:mb-10'>
        <h2 className='text-3xl md:text-4xl font-black mb-2 md:mb-3'>
          What&apos;s your vibe?
        </h2>
        <p className='text-slate-400 text-base md:text-lg'>
          Select all that apply to your travel style
        </p>
      </div>

      <div className='grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-8 md:mb-12'>
        {VIBES.map((vibe) => {
          const isSelected = selectedVibes.includes(vibe.id);
          const Icon = vibe.icon;
          return (
            <motion.button
              key={vibe.id}
              onClick={() => toggleVibe(vibe.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative p-6 rounded-3xl border text-left transition-all ${
                isSelected
                  ? "bg-amber-600 text-white border-amber-500"
                  : "bg-slate-900/40 border-white/5 hover:bg-slate-800 hover:border-white/10"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                  isSelected
                    ? "bg-white/20 text-white"
                    : "bg-white/5 text-slate-400"
                }`}
              >
                <Icon className='w-6 h-6' />
              </div>
              <h3
                className={`text-lg font-bold mb-1 ${isSelected ? "text-white" : "text-slate-300"}`}
              >
                {vibe.label}
              </h3>
              <p
                className={`text-xs font-medium uppercase tracking-wider ${isSelected ? "text-white/80" : "text-slate-500"}`}
              >
                {vibe.desc}
              </p>

              {isSelected && (
                <div className='absolute top-4 right-4 bg-white/20 rounded-full p-1'>
                  <Check className='w-3 h-3 text-white' />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className='flex justify-center'>
        <button
          onClick={() => handleUpdateProfile("CREW")}
          disabled={selectedVibes.length === 0}
          className='px-12 py-4 bg-white text-slate-950 rounded-full font-black text-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 hover:bg-slate-200'
        >
          Next Step
        </button>
      </div>
    </motion.div>
  );
};
