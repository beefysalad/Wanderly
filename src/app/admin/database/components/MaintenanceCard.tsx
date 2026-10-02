import { Database } from "lucide-react";

/** Admin maintenance actions: currently just a "coming soon" placeholder. */
export const MaintenanceCard = () => (
  <div className='bg-slate-900/50 border border-white/10 rounded-2xl p-8'>
    <div className='flex items-center gap-3 mb-6'>
      <Database className='w-6 h-6 text-amber-500' />
      <h2 className='text-xl font-bold text-white'>Maintenance Actions</h2>
    </div>

    <div className='bg-white/5 rounded-xl p-6 border border-white/10 flex flex-col justify-center items-center text-center opacity-50 cursor-not-allowed'>
      <Database className='w-10 h-10 text-slate-600 mb-4' />
      <h3 className='font-bold text-slate-400'>Database Optimization</h3>
      <p className='text-sm text-slate-600'>Coming Soon</p>
    </div>
  </div>
);
