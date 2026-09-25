import { Plane } from "lucide-react";
import { motion } from "framer-motion";
import type { Step } from "../onboardingOptions";

interface IWelcomeStepProps {
  setStep: (step: Step) => void;
}

export const WelcomeStep = ({ setStep }: IWelcomeStepProps) => {
  return (
    <motion.div
      key='welcome'
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
      className='text-center max-w-2xl mx-auto'
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className='w-24 h-24 bg-slate-800 rounded-3xl rotate-3 flex items-center justify-center mx-auto mb-8 shadow-2xl border border-white/10'
      >
        <Plane className='w-12 h-12 text-amber-500' />
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className='text-5xl md:text-7xl font-black tracking-tighter mb-6 text-white'
      >
        Welcome to <br /> Wanderly
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className='text-xl text-slate-400 mb-12 font-medium max-w-lg mx-auto leading-relaxed'
      >
        Let&apos;s personalize your journey. We&apos;ll help you
        plan, split costs, and travel better.
      </motion.p>

      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={() => setStep("IDENTITY")}
        className='group relative px-10 py-5 bg-amber-600 hover:bg-amber-700 text-white rounded-full font-black text-lg tracking-wide hover:scale-105 active:scale-95 transition-all'
      >
        Begin Journey
      </motion.button>
    </motion.div>
  );
};
