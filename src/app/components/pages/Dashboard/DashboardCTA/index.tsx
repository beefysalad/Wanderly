import { Plus, Users } from "lucide-react";
import React from "react";

interface IDashboardCTAProps {
  setShowCreateModal: (show: boolean) => void;
  setShowJoinModal: (show: boolean) => void;
}
const DashboardCTA = ({
  setShowCreateModal,
  setShowJoinModal,
}: IDashboardCTAProps) => {
  return (
    <div className='grid gap-4 sm:gap-6 lg:grid-cols-2 mb-6 sm:mb-8'>
      <button
        onClick={() => setShowCreateModal(true)}
        className='group relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-2xl p-4 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-left'
      >
        <div className='relative z-10'>
          <div className='w-10 h-10 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform'>
            <Plus className='w-5 h-5 sm:w-7 sm:h-7' />
          </div>
          <h3 className='text-lg sm:text-2xl font-bold mb-1 sm:mb-2'>
            Create Group
          </h3>
          <p className='text-amber-50 text-xs sm:text-sm'>
            Start a new travel adventure with friends
          </p>
        </div>
      </button>

      <button
        onClick={() => setShowJoinModal(true)}
        className='group relative overflow-hidden bg-white hover:bg-amber-50 border-2 border-amber-500 hover:border-amber-600 text-amber-600 rounded-2xl p-4 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-left'
      >
        <div className='relative z-10'>
          <div className='w-10 h-10 sm:w-14 sm:h-14 bg-amber-100 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform'>
            <Users className='w-5 h-5 sm:w-7 sm:h-7 text-amber-600' />
          </div>
          <h3 className='text-lg sm:text-2xl font-bold mb-1 sm:mb-2 text-slate-900'>
            Join Group
          </h3>
          <p className='text-slate-600 text-xs sm:text-sm'>
            Enter a code to join an existing group
          </p>
        </div>
      </button>
    </div>
  );
};

export default DashboardCTA;
