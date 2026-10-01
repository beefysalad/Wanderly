import { Activity, Users } from "lucide-react";

interface IUserStatsCardsProps {
  total: number;
  newToday: number;
}

/** The "Total Users" / "New Today" summary cards in the admin users header. */
export const UserStatsCards = ({ total, newToday }: IUserStatsCardsProps) => (
  <div className='flex gap-4'>
    <div className='bg-slate-900/50 border border-white/10 rounded-xl p-4 flex items-center gap-4 min-w-[180px]'>
      <div className='p-3 bg-blue-500/10 rounded-xl'>
        <Users className='w-6 h-6 text-blue-400' />
      </div>
      <div>
        <div className='text-xs text-slate-400 uppercase font-bold tracking-wider'>Total Users</div>
        <div className='text-2xl font-bold text-white'>{total}</div>
      </div>
    </div>
    <div className='bg-slate-900/50 border border-white/10 rounded-xl p-4 flex items-center gap-4 min-w-[180px]'>
      <div className='p-3 bg-emerald-500/10 rounded-xl'>
        <Activity className='w-6 h-6 text-emerald-400' />
      </div>
      <div>
        <div className='text-xs text-slate-400 uppercase font-bold tracking-wider'>New Today</div>
        <div className='text-2xl font-bold text-white'>+{newToday}</div>
      </div>
    </div>
  </div>
);
