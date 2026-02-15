"use client";
import { useGroups } from "@/src/hooks/useGroups";
import {
  CalendarIcon,
  Code2,
  Compass,
  Users,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getGroupColorClasses } from "@/lib/utils/groupColors";
import DashboardBottomNav from "../components/pages/Dashboard/DashboardBottomNav";
import DashboardLayoutHeader from "../components/shared/DashboardLayoutHeader";

const GroupsPage = () => {
  const router = useRouter();
  const { data: groupsData, isLoading } = useGroups();
  const allGroups = groupsData?.groups || [];

  // Sort groups by createdAt descending (most recent first)
  const sortedGroups = [...allGroups].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });

  const handleNavigateToGroup = (groupId: string) => {
    router.push(`/group/${groupId}`);
  };

  if (isLoading) {
    return (
      <main className='min-h-screen bg-slate-950 flex items-center justify-center pb-24'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-slate-700 border-t-orange-500 rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-slate-400 font-medium'>Loading groups...</p>
        </div>
      </main>
    );
  }

  return (
    <main className='min-h-screen bg-slate-950 pb-28 relative overflow-hidden'>
      {/* Background Effects */}
      <div className='absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none'>
        <div className='absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-3xl'></div>
        <div className='absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-3xl'></div>
      </div>

      <div className='max-w-5xl mx-auto px-4 py-6 relative z-10'>
        {/* Header */}
        <DashboardLayoutHeader
          showBack={true}
          backUrl='/dashboard'
          title='Your Groups'
          description={`${sortedGroups.length} ${
            sortedGroups.length === 1 ? "group" : "groups"
          }`}
        />

        {/* Groups List */}
        {sortedGroups.length === 0 ? (
          <div className='bg-slate-800/20 backdrop-blur-xl rounded-3xl border border-white/5 p-16 text-center mt-6'>
            <div className='w-20 h-20 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6'>
              <Compass className='w-10 h-10 text-orange-400' />
            </div>
            <h3 className='text-xl font-bold text-white mb-2'>No groups yet</h3>
            <p className='text-sm text-slate-400 max-w-sm mx-auto'>
              Create your first group to start planning amazing adventures!
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6'>
            {sortedGroups.map((group) => {
              const colors = getGroupColorClasses(group.colorScheme);
              const hasEmoji = !!group.emoji;
              return (
                <button
                  key={group.id}
                  onClick={() => handleNavigateToGroup(group.id)}
                  className='group relative w-full bg-slate-900/40 hover:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-5 border border-white/5 hover:border-orange-500/30 transition-all duration-300 text-left flex flex-col items-start gap-4 overflow-hidden'
                >
                  {/* Hover Gradient */}
                  <div className='absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none' />

                  {/* Header: Icon + Name */}
                  <div className='flex items-start gap-4 w-full'>
                    <div
                      className={`w-12 h-12 ${
                        hasEmoji ? "bg-slate-700/50" : colors.bg
                      } rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                        hasEmoji ? "" : "text-white"
                      } text-2xl group-hover:scale-110 transition-transform duration-300`}
                    >
                      {group.emoji || <Compass className='w-6 h-6' />}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <h3 className='text-lg font-bold text-white group-hover:text-orange-400 transition-colors truncate'>
                        {group.name}
                      </h3>
                      <div className='flex items-center gap-1.5 mt-1'>
                        <span className='px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-slate-400 flex items-center gap-1'>
                          <Code2 className='w-3 h-3' />
                          {group.code}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className='flex items-center gap-4 w-full pt-4 border-t border-white/5 mt-auto'>
                    <div className='flex items-center gap-1.5 text-xs text-slate-400'>
                      <CalendarIcon className='w-3.5 h-3.5 text-orange-400' />
                      <span className='font-semibold text-white'>
                        {group.trips?.length || 0}
                      </span>
                      <span>trips</span>
                    </div>
                    <div className='flex items-center gap-1.5 text-xs text-slate-400'>
                      <Users className='w-3.5 h-3.5 text-amber-400' />
                      <span className='font-semibold text-white'>
                        {group.memberEmails?.length || 0}
                      </span>
                      <span>members</span>
                    </div>
                    <ChevronRight className='w-4 h-4 text-slate-600 group-hover:text-orange-400 ml-auto transition-colors' />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <DashboardBottomNav />
    </main>
  );
};

export default GroupsPage;
