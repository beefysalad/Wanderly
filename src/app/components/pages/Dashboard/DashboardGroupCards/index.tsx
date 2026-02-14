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

  // Get average color scheme for header icon (or use first group's color)
  const headerColor =
    groups.length > 0
      ? getGroupColorClasses(groups[0].colorScheme)
      : getGroupColorClasses("orange");

  return (
    <div className='flex-1'>
      <h2 className='text-lg font-semibold text-white mb-3 flex items-center gap-2'>
        Your Groups
      </h2>
      {groups.length === 0 ? (
        <div className='bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-dashed border-white/10 p-12 text-center'>
          <div className='w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4'>
            <Compass className='w-8 h-8 text-amber-400' />
          </div>
          <h3 className='text-base font-semibold text-white mb-2'>
            No groups yet
          </h3>
          <p className='text-sm text-slate-400'>
            Create your first group to start planning!
          </p>
        </div>
      ) : (
        <>
          <div className='space-y-2'>
            {displayGroups.map((group) => {
              const colors = getGroupColorClasses(group.colorScheme);
              const hasEmoji = !!group.emoji;
              return (
                <button
                  key={group.id}
                  onClick={() => handleNavigateToGroup(group.id)}
                  className='group w-full bg-slate-800/30 hover:bg-slate-700/40 backdrop-blur-xl rounded-2xl p-4 border border-white/5 hover:border-orange-500/30 transition-all duration-300 text-left active:scale-[0.98]'
                >
                  <div className='flex items-center gap-3'>
                    <div
                      className={`w-12 h-12 ${hasEmoji ? "bg-slate-700/50" : colors.bg} rounded-xl flex items-center justify-center flex-shrink-0 ${hasEmoji ? "" : "text-white"} text-xl`}
                    >
                      {group.emoji || <Compass className='w-5 h-5' />}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 mb-1'>
                        <h3 className='text-base font-semibold text-white truncate group-hover:text-orange-400 transition-colors'>
                          {group.name}
                        </h3>
                        <div className='flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 bg-slate-700/50 text-slate-300 rounded-full border border-white/10 flex-shrink-0'>
                          <Code2 className='w-2.5 h-2.5' />
                          {group.code}
                        </div>
                      </div>
                      <div className='flex items-center gap-3 text-xs text-slate-400'>
                        <div className='flex items-center gap-1'>
                          <CalendarIcon className='w-3 h-3 text-orange-400' />
                          <span className='font-medium text-white'>
                            {group.trips?.length || 0}
                          </span>
                          <span>trips</span>
                        </div>
                        <div className='flex items-center gap-1'>
                          <Users className='w-3 h-3 text-amber-400' />
                          <span className='font-medium text-white'>
                            {group.memberEmails?.length || 0}
                          </span>
                          <span>members</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className='w-5 h-5 text-slate-400 group-hover:text-orange-400 group-hover:translate-x-1 transition-all flex-shrink-0' />
                  </div>
                </button>
              );
            })}
          </div>
          {hasMoreGroups && onViewAll && (
            <button
              onClick={onViewAll}
              className='mt-3 w-full bg-slate-800/30 hover:bg-slate-700/40 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-orange-500/30 px-4 py-3 text-sm font-medium text-slate-300 hover:text-orange-400 transition-all duration-200 flex items-center justify-center gap-2 group'
            >
              <span>View All Groups ({totalGroups})</span>
              <ArrowRight className='w-4 h-4 group-hover:translate-x-1 transition-transform' />
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default DashboardGroupCards;
