import { Group } from "@/src/shared/types";
import { CalendarIcon, Code2, Compass, Sparkles, Users } from "lucide-react";
import React from "react";

interface IDashboardGroupCardsProps {
  groups: Group[];
  handleNavigateToGroup: (groupId: string) => void;
}
const DashboardGroupCards = ({
  groups,
  handleNavigateToGroup,
}: IDashboardGroupCardsProps) => {
  return (
    <div className='flex-1'>
      <h2 className='text-xl font-bold text-slate-900 mb-4 flex items-center gap-2'>
        <Sparkles className='w-5 h-5 text-amber-500' />
        Your Groups
      </h2>
      {groups.length === 0 ? (
        <div className='bg-white rounded-2xl border-2 border-dashed border-slate-300 p-8 sm:p-16 text-center'>
          <div className='w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4'>
            <Compass className='w-8 h-8 sm:w-10 sm:h-10 text-amber-600' />
          </div>
          <h3 className='text-lg sm:text-xl font-semibold text-slate-900 mb-2'>
            No groups yet
          </h3>
          <p className='text-sm sm:text-base text-slate-500 mb-6'>
            Create your first group to start planning amazing trips!
          </p>
        </div>
      ) : (
        <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => handleNavigateToGroup(group.id)}
              className='group bg-white rounded-2xl p-6 border border-slate-200 hover:border-amber-400 hover:shadow-xl transition-all duration-300 text-left hover:scale-[1.02] active:scale-[0.98]'
            >
              <div className='flex items-start justify-between mb-4'>
                <div className='w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform'>
                  <Compass className='w-6 h-6 text-white' />
                </div>
                <div className='flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full border border-amber-200'>
                  <Code2 className='w-3 h-3' />
                  {group.code}
                </div>
              </div>

              <h3 className='text-xl font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-amber-600 transition-colors'>
                {group.name}
              </h3>

              <div className='flex items-center gap-4 text-sm text-slate-600'>
                <div className='flex items-center gap-1.5'>
                  <CalendarIcon className='w-4 h-4 text-amber-500' />
                  <span className='font-medium'>
                    {group.trips?.length || 0}
                  </span>
                  <span>trips</span>
                </div>
                <div className='flex items-center gap-1.5'>
                  <Users className='w-4 h-4 text-amber-500' />
                  <span className='font-medium'>
                    {group.members?.length || 0}
                  </span>
                  <span>members</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardGroupCards;
