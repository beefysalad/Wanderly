"use client";
import { useGroups } from "@/src/hooks/useGroups";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import {
  CalendarIcon,
  Code2,
  Compass,
  Users,
  ArrowLeft,
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

  const handleLogout = async () => {
    await signOut(auth);
  };

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
    <main className='min-h-screen bg-slate-950 pb-24 relative overflow-hidden'>
      {/* Background Effects */}
      <div className='absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none'>
        <div className='absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-3xl'></div>
        <div className='absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-3xl'></div>
      </div>

      <div className='max-w-4xl mx-auto px-4 py-6 relative z-10'>
        {/* Header */}
        <DashboardLayoutHeader
          showBack={true}
          backUrl='/dashboard'
          title='Your Groups'
          description={`${sortedGroups.length} ${sortedGroups.length === 1 ? "group" : "groups"}`}
        />

        {/* Groups List */}
        {sortedGroups.length === 0 ? (
          <div className='bg-slate-800/20 backdrop-blur-xl rounded-3xl border border-white/5 p-16 text-center'>
            <div className='w-20 h-20 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6'>
              <Compass className='w-10 h-10 text-orange-400' />
            </div>
            <h3 className='text-xl font-bold text-white mb-2'>No groups yet</h3>
            <p className='text-sm text-slate-400 max-w-sm mx-auto'>
              Create your first group to start planning amazing adventures!
            </p>
          </div>
        ) : (
          <div className='space-y-3'>
            {sortedGroups.map((group) => {
              const colors = getGroupColorClasses(group.colorScheme);
              const hasEmoji = !!group.emoji;
              return (
                <button
                  key={group.id}
                  onClick={() => handleNavigateToGroup(group.id)}
                  className='group w-full bg-slate-800/20 hover:bg-slate-800/40 backdrop-blur-xl rounded-2xl p-5 border border-white/5 hover:border-orange-500/30 transition-all duration-300 text-left'
                >
                  <div className='flex items-center gap-4'>
                    {/* Icon */}
                    <div
                      className={`w-16 h-16 ${hasEmoji ? "bg-slate-700/50" : colors.bg} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${hasEmoji ? "" : "text-white"} text-2xl`}
                    >
                      {group.emoji || <Compass className='w-7 h-7' />}
                    </div>

                    {/* Content */}
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 mb-2'>
                        <h3 className='text-lg font-bold text-white group-hover:text-orange-400 transition-colors truncate'>
                          {group.name}
                        </h3>
                        <div className='flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 bg-slate-700/50 text-slate-300 rounded-lg border border-white/10 flex-shrink-0'>
                          <Code2 className='w-3 h-3' />
                          {group.code}
                        </div>
                      </div>
                      <div className='flex items-center gap-4 text-sm'>
                        <div className='flex items-center gap-1.5 text-slate-400'>
                          <CalendarIcon className='w-4 h-4 text-orange-400' />
                          <span className='font-semibold text-white'>
                            {group.trips?.length || 0}
                          </span>
                          <span>trips</span>
                        </div>
                        <div className='flex items-center gap-1.5 text-slate-400'>
                          <Users className='w-4 h-4 text-amber-400' />
                          <span className='font-semibold text-white'>
                            {group.memberEmails?.length || 0}
                          </span>
                          <span>members</span>
                        </div>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className='w-5 h-5 text-slate-400 group-hover:text-orange-400 group-hover:translate-x-1 transition-all flex-shrink-0' />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <DashboardBottomNav onLogout={handleLogout} />
    </main>
  );
};

export default GroupsPage;
