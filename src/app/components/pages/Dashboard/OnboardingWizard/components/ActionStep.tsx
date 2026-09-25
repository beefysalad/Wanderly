import { PlaneIcon, Users } from "lucide-react";
import { motion } from "framer-motion";

interface IActionStepProps {
  handleCompleteOnboarding: (nextAction?: "CREATE_GROUP" | "JOIN_GROUP") => void;
}

export const ActionStep = ({ handleCompleteOnboarding }: IActionStepProps) => {
  return (
    <motion.div
      key='action'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className='w-full h-[80vh] flex flex-col md:flex-row gap-4 md:gap-8 max-w-6xl mx-auto items-center justify-center'
    >
      <motion.button
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        whileHover={{ scale: 1.02, flex: 1.2 }}
        onClick={() => handleCompleteOnboarding("CREATE_GROUP")}
        className='group flex-1 w-full h-full min-h-[300px] bg-amber-900/10 border border-amber-500/20 hover:bg-amber-900/20 hover:border-amber-500/40 rounded-[40px] flex flex-col items-center justify-center p-8 transition-all duration-500 backdrop-blur-md'
      >
        <div className='w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mb-8 border border-amber-500/20 group-hover:scale-110 transition-transform duration-500'>
          <PlaneIcon className='w-10 h-10 text-amber-500' />
        </div>
        <h2 className='text-4xl font-black text-white mb-4 text-center uppercase tracking-tight'>
          Plan a Trip
        </h2>
        <p className='text-slate-400 text-center max-w-xs text-lg font-medium group-hover:text-amber-200 transition-colors'>
          Create a new group and start your adventure from scratch.
        </p>
      </motion.button>

      <div className='text-slate-500 font-bold text-xl uppercase tracking-widest'>
        OR
      </div>

      <motion.button
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        whileHover={{ scale: 1.02, flex: 1.2 }}
        onClick={() => handleCompleteOnboarding("JOIN_GROUP")}
        className='group flex-1 w-full h-full min-h-[300px] bg-indigo-900/10 border border-indigo-500/20 hover:bg-indigo-900/20 hover:border-indigo-500/40 rounded-[40px] flex flex-col items-center justify-center p-8 transition-all duration-500 backdrop-blur-md'
      >
        <div className='w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mb-8 border border-indigo-500/20 group-hover:scale-110 transition-transform duration-500'>
          <Users className='w-10 h-10 text-indigo-500' />
        </div>
        <h2 className='text-4xl font-black text-white mb-4 text-center uppercase tracking-tight'>
          Join a Crew
        </h2>
        <p className='text-slate-400 text-center max-w-xs text-lg font-medium group-hover:text-indigo-200 transition-colors'>
          Have a code? Enter it to join an existing trip instantly.
        </p>
      </motion.button>
    </motion.div>
  );
};
