import Link from "next/link";
import React from "react";

const DashboardCTA = () => {
  return (
    <div className='flex items-center gap-3'>
      <Link
        href='/group/create'
        className='px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-full transition-colors'
      >
        Create Group
      </Link>

      <Link
        href='/group/join'
        className='px-5 py-2.5 bg-transparent hover:bg-white/5 border border-white/10 text-slate-300 hover:text-white text-sm font-semibold rounded-full transition-colors'
      >
        Join Group
      </Link>
    </div>
  );
};

export default DashboardCTA;
