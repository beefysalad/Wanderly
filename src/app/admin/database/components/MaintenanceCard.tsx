import { AlertTriangle, Database, Trash2 } from "lucide-react";

interface IMaintenanceCardProps {
  maintaining: boolean;
  onCleanTestData: () => void;
}

/** Admin maintenance actions: clean seeded test data, plus a "coming soon" placeholder. */
export const MaintenanceCard = ({ maintaining, onCleanTestData }: IMaintenanceCardProps) => (
  <div className='bg-slate-900/50 border border-white/10 rounded-2xl p-8'>
    <div className='flex items-center gap-3 mb-6'>
      <AlertTriangle className='w-6 h-6 text-amber-500' />
      <h2 className='text-xl font-bold text-white'>Maintenance Actions</h2>
    </div>

    <div className='space-y-6'>
      <div className='bg-white/5 rounded-xl p-6 border border-white/10'>
        <div className='flex items-center gap-3 mb-2'>
          <Trash2 className='w-5 h-5 text-rose-500' />
          <h3 className='font-bold text-white'>Clean Test Data</h3>
        </div>
        <p className='text-sm text-slate-400 mb-6'>
          Removes all users and their data that were created via the test seeding service. Use this periodically to keep the database lean.
        </p>
        <button
          onClick={onCleanTestData}
          disabled={maintaining}
          className='w-full py-3 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 font-bold hover:bg-rose-500/20 transition-all disabled:opacity-50'
        >
          {maintaining ? "Cleaning..." : "Clean Test Data Now"}
        </button>
      </div>

      <div className='bg-white/5 rounded-xl p-6 border border-white/10 flex flex-col justify-center items-center text-center opacity-50 cursor-not-allowed'>
        <Database className='w-10 h-10 text-slate-600 mb-4' />
        <h3 className='font-bold text-slate-400'>Database Optimization</h3>
        <p className='text-sm text-slate-600'>Coming Soon</p>
      </div>
    </div>
  </div>
);
