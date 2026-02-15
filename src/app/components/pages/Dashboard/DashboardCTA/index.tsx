import Link from "next/link";
import React from "react";

interface IDashboardCTAProps {
  setShowJoinModal: (show: boolean) => void;
}
const DashboardCTA = ({ setShowJoinModal }: IDashboardCTAProps) => {
  return (
    <div className='flex items-center gap-3'>
      <Link
        href='/group/create'
        className='px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-full transition-colors'
      >
        Create Group
      </Link>

      <button
        onClick={() => setShowJoinModal(true)}
        className='px-5 py-2.5 bg-transparent hover:bg-white/5 border border-white/10 text-slate-300 hover:text-white text-sm font-semibold rounded-full transition-colors'
      >
        Join Group
      </button>
    </div>
  );
};

export default DashboardCTA;
