"use client";

import { motion } from "framer-motion";
import { Hammer, Clock, AlertTriangle } from "lucide-react";

export function MaintenanceMode() {
  return (
    <div className='min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden'>
      {/* Background Decorative Elements */}
      <div className='absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none'>
        <div className='absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]' />
        <div className='absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]' />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className='max-w-md w-full text-center z-10'
      >
        <div className='inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl mb-8 relative'>
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Hammer className='w-10 h-10 text-blue-400' />
          </motion.div>
          <div className='absolute -top-2 -right-2 bg-amber-500 rounded-full p-1.5 shadow-lg border-2 border-slate-950'>
            <AlertTriangle className='w-3 h-3 text-slate-950' />
          </div>
        </div>

        <h1 className='text-4xl font-bold text-white tracking-tight mb-4'>
          Wanderly is Under <span className='text-blue-400'>Maintenance</span>
        </h1>
        
        <p className='text-slate-400 text-lg mb-8 leading-relaxed'>
            I&apos;m polishing things up to make your group trip planning experience even better. Wanderly will be back shortly!
        </p>

        <div className='grid grid-cols-1 gap-4 mb-8'>
          <div className='bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-4 flex items-center gap-4 text-left'>
            <div className='w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0'>
              <Clock className='w-5 h-5 text-blue-400' />
            </div>
            <div>
              <div className='text-sm text-slate-500 font-medium'>Estimated Time</div>
              <div className='text-white font-semibold'>~ 30-60 Minutes</div>
            </div>
          </div>
        </div>

        <div className='pt-8 border-t border-slate-800/50'>
          <p className='text-slate-500 text-sm'>
            Need urgent help? Contact me via email <a href='mailto:mandal.johnpatrickryan@gmail.com'>mandal.johnpatrickryan@gmail.com</a>.
          </p>
        </div>
      </motion.div>

    
      <div className='absolute bottom-8 left-1/2 -translate-x-1/2'>
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className='w-1 h-12 rounded-full bg-gradient-to-b from-blue-500/50 to-transparent'
        />
      </div>
    </div>
  );
}
