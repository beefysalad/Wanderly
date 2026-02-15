import { getGroupColorClasses } from "@/lib/utils/groupColors";
import { Group } from "@/src/shared/types";
import {
  ArrowRight,
  CalendarIcon,
  ChevronRight,
  Compass,
  Users,
} from "lucide-react";

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

  return (
    <div className='flex-1'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-lg font-semibold text-white flex items-center gap-2'>
          Your Groups{" "}
        </h2>
        {hasMoreGroups && onViewAll && (
          <button
            onClick={onViewAll}
            className='text-xs text-orange-400 hover:text-orange-300 font-medium flex items-center gap-1 transition-colors'
          >
            Show All ({totalGroups})
            <ChevronRight className='w-3 h-3' />
          </button>
        )}
      </div>

      {groups.length === 0 ? (
        <div className='bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-dashed border-white/10 p-8 text-center'>
          <div className='w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mx-auto mb-3'>
            <Compass className='w-6 h-6 text-amber-400' />
          </div>
          <h3 className='text-sm font-semibold text-white mb-1'>
            No groups yet
          </h3>
          <p className='text-xs text-slate-400'>
            Create your first group to start planning!
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {displayGroups.map((group) => {
            return (
              <button
                key={group.id}
                onClick={() => handleNavigateToGroup(group.id)}
                className='group relative flex flex-col items-start h-full min-h-[180px] w-full bg-slate-900 rounded-2xl border border-white/5 overflow-hidden transition-all duration-300 hover:border-white/10 hover:bg-slate-800'
              >
                {/* Content */}
                <div className='relative z-10 p-6 flex flex-col justify-between h-full w-full'>
                  <div className='flex justify-between items-start w-full'>
                    <div className='w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-3xl shadow-lg ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-500'>
                      {group.emoji || (
                        <Compass className='w-7 h-7 text-white' />
                      )}
                    </div>
                    <div className='w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0'>
                      <ArrowRight className='w-5 h-5 text-white' />
                    </div>
                  </div>

                  <div className='space-y-3 mt-4'>
                    <h3 className='text-2xl font-black text-white leading-tight tracking-tight text-left line-clamp-2'>
                      {group.name}
                    </h3>

                    <div className='flex items-center gap-3'>
                      <div className='flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950 border border-white/10'>
                        <Users className='w-3.5 h-3.5 text-slate-400' />
                        <span className='text-xs font-medium text-slate-300'>
                          {group.memberEmails?.length || 0}
                        </span>
                      </div>
                      <div className='flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950 border border-white/10'>
                        <CalendarIcon className='w-3.5 h-3.5 text-slate-400' />
                        <span className='text-xs font-medium text-slate-300'>
                          {group.trips?.length || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DashboardGroupCards;
