import { Calendar, CreditCard, Users } from "lucide-react";
import { motion } from "framer-motion";
import type { Step } from "../onboardingOptions";

interface ITutorialStepProps {
  setStep: (step: Step) => void;
}

export const TutorialStep = ({ setStep }: ITutorialStepProps) => {
  return (
    <motion.div
      key='tutorial'
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
      className='max-w-5xl mx-auto px-4'
    >
      <div className='text-center mb-8 md:mb-12'>
        <h2 className='text-2xl md:text-3xl font-bold mb-2'>
          Here&apos;s what you can do
        </h2>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-12'>
        {[
          {
            title: "Squad Goals",
            desc: "Create groups and invite your friends instantly.",
            icon: Users,
            color: "text-blue-400",
            bg: "bg-blue-500/10 border-blue-500/20",
          },
          {
            title: "Perfect Plan",
            desc: "Build detailed itineraries with ease.",
            icon: Calendar,
            color: "text-purple-400",
            bg: "bg-purple-500/10 border-purple-500/20",
          },
          {
            title: "Split Costs",
            desc: "Track expenses and settle up without the math.",
            icon: CreditCard,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10 border-emerald-500/20",
          },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className='bg-slate-900/40 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-2xl md:rounded-3xl'
          >
            <div
              className={`w-12 h-12 md:w-16 md:h-16 ${item.bg} rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-lg border`}
            >
              <item.icon
                className={`w-6 h-6 md:w-8 md:h-8 ${item.color}`}
              />
            </div>
            <h3 className='text-lg md:text-xl font-bold text-white mb-2'>
              {item.title}
            </h3>
            <p className='text-sm md:text-base text-slate-400 leading-relaxed'>
              {item.desc}
            </p>
          </motion.div>
        ))}
      </div>

      <div className='flex justify-center'>
        <button
          onClick={() => setStep("ACTION")}
          className='px-8 md:px-12 py-3 md:py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-full font-black text-base md:text-lg hover:scale-105 active:scale-95 transition-all shadow-xl shadow-amber-900/20'
        >
          I&apos;m Ready
        </button>
      </div>
    </motion.div>
  );
};
