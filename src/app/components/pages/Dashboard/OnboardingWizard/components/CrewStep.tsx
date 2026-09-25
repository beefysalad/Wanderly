import { motion } from "framer-motion";
import { CREWS } from "../onboardingOptions";
import type { Step } from "../onboardingOptions";

interface ICrewStepProps {
  selectedCrew: string;
  setSelectedCrew: (value: string) => void;
  handleUpdateProfile: (nextStep: Step) => void;
}

export const CrewStep = ({ selectedCrew, setSelectedCrew, handleUpdateProfile }: ICrewStepProps) => {
  return (
    <motion.div
      key='crew'
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className='max-w-4xl mx-auto'
    >
      <div className='text-center mb-6 md:mb-10'>
        <h2 className='text-3xl md:text-4xl font-black mb-2 md:mb-3'>
          Who&apos;s your crew?
        </h2>
        <p className='text-slate-400 text-base md:text-lg px-4'>
          Who do you usually explore the world with?
        </p>
      </div>

      <div className='grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-12'>
        {CREWS.map((item) => {
          const isSelected = selectedCrew === item.id;
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              onClick={() => setSelectedCrew(item.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-4 md:p-6 rounded-2xl md:rounded-[32px] border text-center transition-all flex flex-col items-center justify-center aspect-square ${
                isSelected
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-xl"
                  : "bg-slate-900/40 border-white/5 hover:bg-slate-800 text-slate-400"
              }`}
            >
              <Icon
                className={`w-8 h-8 md:w-10 md:h-10 mb-3 md:mb-4 ${isSelected ? "text-white" : "text-slate-500"}`}
              />
              <h3 className={`text-base md:text-lg font-bold mb-1`}>
                {item.label}
              </h3>
              <p
                className={`text-[10px] md:text-xs leading-tight ${isSelected ? "text-white/80" : "text-slate-500"}`}
              >
                {item.desc}
              </p>
            </motion.button>
          );
        })}
      </div>

      <div className='flex justify-center'>
        <button
          onClick={() => handleUpdateProfile("TUTORIAL")}
          disabled={!selectedCrew}
          className='px-12 py-4 bg-white text-slate-950 rounded-full font-black text-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 hover:bg-slate-200'
        >
          Continue
        </button>
      </div>
    </motion.div>
  );
};
