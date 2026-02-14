import { Plus, Users, ChevronRight } from "lucide-react";
import Link from "next/link";
import React from "react";

interface IDashboardCTAProps {
  setShowJoinModal: (show: boolean) => void;
}
const DashboardCTA = ({ setShowJoinModal }: IDashboardCTAProps) => {
  return (
    <div className='space-y-3 mb-6'>
      <Link
        href='/group/create'
        className='group flex items-center justify-between bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl p-4 shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-300 active:scale-[0.98]'
      >
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0'>
            <Plus className='w-5 h-5' />
          </div>
          <div>
            <h3 className='text-base font-semibold'>Create Group</h3>
            <p className='text-xs text-orange-50/80'>Start a new adventure</p>
          </div>
        </div>
        <ChevronRight className='w-5 h-5 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all' />
      </Link>

      <button
        onClick={() => setShowJoinModal(true)}
        className='group w-full flex items-center justify-between bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur-xl border border-amber-500/20 hover:border-amber-500/40 text-white rounded-2xl p-4 shadow-lg transition-all duration-300 active:scale-[0.98]'
      >
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 bg-amber-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0'>
            <Users className='w-5 h-5 text-amber-400' />
          </div>
          <div className='text-left'>
            <h3 className='text-base font-semibold'>Join Group</h3>
            <p className='text-xs text-slate-400'>Enter a group code</p>
          </div>
        </div>
        <ChevronRight className='w-5 h-5 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all' />
      </button>
    </div>
  );
};

export default DashboardCTA;
