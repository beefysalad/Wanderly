import { Group } from "@/src/shared/types";
import {
  CalendarIcon,
  Code2,
  Compass,
  Sparkles,
  Users,
  ArrowRight,
} from "lucide-react";
import React from "react";
import { getGroupColorClasses } from "@/lib/utils/groupColors";

interface IDashboardGroupCardsProps {
  groups: Group[];
  handleNavigateToGroup: (groupId: string) => void;
  limit?: number;
  totalGroups?: number;
  onViewAll?: () => void;
}
const DashboardGroupCards = ({
  groups,
  handleNavigateToGroup,
  limit,
  totalGroups,
  onViewAll,
}: IDashboardGroupCardsProps) => {
  const displayGroups = limit ? groups.slice(0, limit) : groups;
  const hasMoreGroups = limit && totalGroups && totalGroups > limit;

  // Get average color scheme for header icon (or use first group's color)
  const headerColor = groups.length > 0 
    ? getGroupColorClasses(groups[0].colorScheme)
    : getGroupColorClasses("orange");

  return (
    <div className='flex-1'>
      <h2 className='text-xl font-bold text-slate-900 mb-4 flex items-center gap-2'>
        <Sparkles className={`w-5 h-5 ${headerColor.icon}`} />
        Your Groups
      </h2>
      {groups.length === 0 ? (
        <div className='bg-white rounded-2xl border-2 border-dashed border-slate-300 p-8 sm:p-16 text-center'>
          <div className='w-16 h-16 sm:w-20 sm:h-20 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4'>
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
        <>
          <div className='grid sm:grid-cols-2 gap-3 md:gap-4'>
            {displayGroups.map((group) => {
              const colors = getGroupColorClasses(group.colorScheme);
              const hasEmoji = !!group.emoji;
              return (
                <button
                  key={group.id}
                  onClick={() => handleNavigateToGroup(group.id)}
                  className={`group bg-white rounded-xl p-5 md:p-6 border border-slate-200 ${colors.hoverBorder} hover:shadow-lg transition-all duration-300 text-left active:scale-[0.98]`}
                >
                  <div className='flex items-start justify-between mb-4'>
                    <div className={`w-12 h-12 ${hasEmoji ? 'bg-slate-100' : colors.bg} rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform ${hasEmoji ? '' : 'text-white'} text-2xl`}>
                      {group.emoji || <Compass className='w-6 h-6' />}
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 ${colors.bgLight} ${colors.textDark} rounded-full border ${colors.borderLight}`}>
                      <Code2 className='w-3 h-3' />
                      {group.code}
                    </div>
                  </div>

                  <h3 className={`text-lg md:text-xl font-semibold text-slate-900 mb-3 line-clamp-2 ${colors.hoverText} transition-colors`}>
                    {group.name}
                  </h3>

                  <div className='flex items-center gap-3 md:gap-4 text-sm text-slate-600'>
                    <div className='flex items-center gap-1.5'>
                      <CalendarIcon className={`w-4 h-4 ${colors.icon}`} />
                      <span className='font-medium'>
                        {group.trips?.length || 0}
                      </span>
                      <span>trips</span>
                    </div>
                    <div className='flex items-center gap-1.5'>
                      <Users className={`w-4 h-4 ${colors.icon}`} />
                      <span className='font-medium'>
                        {group.memberEmails?.length || 0}
                      </span>
                      <span>members</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {hasMoreGroups && onViewAll && (
            <button
              onClick={onViewAll}
              className='mt-4 w-full bg-white rounded-xl border border-slate-200 hover:border-orange-400 hover:bg-orange-50 px-4 py-3 text-sm font-medium text-slate-700 hover:text-orange-600 transition-all duration-200 flex items-center justify-center gap-2'
            >
              <span>View All Groups ({totalGroups})</span>
              <ArrowRight className='w-4 h-4' />
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default DashboardGroupCards;
