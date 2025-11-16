import { Button } from "@/components/ui/button";
import { Compass, LogOut } from "lucide-react";
import React from "react";

interface IDashboardHeaderProps {
  handleLogout: () => void;
  userEmail: string | undefined;
}
const DashboardHeader = ({
  handleLogout,
  userEmail,
}: IDashboardHeaderProps) => {
  return (
    <div className='bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6 mb-8'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div className='flex items-center gap-3 sm:gap-4 min-w-0'>
          <div className='w-12 h-12 sm:w-16 sm:h-16 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0'>
            <Compass className='w-6 h-6 sm:w-8 sm:h-8 text-white' />
          </div>
          <div className='min-w-0 flex-1'>
            <h2 className='text-xl sm:text-2xl font-bold text-slate-900 truncate'>
              My Travel Groups
            </h2>
            <p className='text-xs sm:text-sm text-slate-600 mt-1 flex items-center gap-2 truncate'>
              <span className='w-2 h-2 bg-orange-500 rounded-full flex-shrink-0'></span>
              <span className='truncate'>{userEmail}</span>
            </p>
          </div>
        </div>
        <div className='flex gap-2 w-full sm:w-auto'>
          <Button
            onClick={handleLogout}
            variant='outline'
            className='border-slate-300 hover:bg-red-50 hover:border-red-300 hover:text-red-600 text-slate-700 transition-all bg-transparent flex-1 sm:flex-initial flex-shrink-0'
          >
            <LogOut className='w-4 h-4 sm:mr-2' />
            <span className='hidden sm:inline'>Logout</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
