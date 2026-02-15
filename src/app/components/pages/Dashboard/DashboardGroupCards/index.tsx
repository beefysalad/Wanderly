import { getGroupColorClasses } from "@/lib/utils/groupColors";
import { Group } from "@/src/shared/types";
import {
  ArrowRight,
  CalendarIcon,
  ChevronRight,
  Code2,
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
          Your Groups
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
        <div className='grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4'>
          {displayGroups.map((group) => {
            const colors = getGroupColorClasses(group.colorScheme);
            const hasEmoji = !!group.emoji;
            return (
              <button
                key={group.id}
                onClick={() => handleNavigateToGroup(group.id)}
                className='group relative flex flex-col items-start p-4 h-full bg-slate-900/40 hover:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/5 hover:border-orange-500/20 transition-all duration-300 active:scale-[0.98] text-left overflow-hidden shadow-lg shadow-black/20'
              >
                {/* Background Gradient Hover Effect */}
                <div
                  className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-tr ${colors.bg.replace("bg-", "from-")} to-transparent`}
                />

                <div className='flex items-start justify-between w-full mb-4'>
                  <div
                    className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center text-2xl shadow-inner border border-white/10`}
                  >
                    {group.emoji || <Compass className='w-6 h-6 text-white' />}
                  </div>
                  <div className='flex items-center justify-center w-8 h-8 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors'>
                    <ArrowRight className='w-4 h-4 text-slate-400 group-hover:text-white -rotate-45 group-hover:rotate-0 transition-all duration-300' />
                  </div>
                </div>

                <div className='w-full'>
                  <h3 className='text-base font-bold text-white mb-2 truncate leading-tight group-hover:text-orange-200 transition-colors'>
                    {group.name}
                  </h3>

                  <div className='flex flex-wrap gap-2'>
                    {/* Member Count */}
                    <div className='flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-950 px-2 py-1 rounded-md border border-white/5'>
                      <Users className='w-3 h-3' />
                      <span>{group.memberEmails?.length || 0}</span>
                    </div>

                    {/* Trip Count */}
                    <div className='flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-950 px-2 py-1 rounded-md border border-white/5'>
                      <CalendarIcon className='w-3 h-3' />
                      <span>{group.trips?.length || 0}</span>
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
