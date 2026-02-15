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
import Link from "next/link";
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
      <div className='max-w-3xl mx-auto px-4 py-8 relative z-10'>
        {/* Header */}
        <DashboardLayoutHeader
          showBack={true}
          backUrl='/dashboard'
          title='Your Groups'
          description='Manage your travel groups'
          className='mb-8'
        />

        {/* Groups List */}
        {sortedGroups.length === 0 ? (
          <div className='bg-slate-900 rounded-2xl border border-white/5 p-12 text-center'>
            <div className='w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4'>
              <Compass className='w-8 h-8 text-slate-500' />
            </div>
            <h3 className='text-lg font-bold text-white mb-2'>No groups yet</h3>
            <p className='text-sm text-slate-400 max-w-sm mx-auto mb-6'>
              Create a group to get started.
            </p>
            <Link
              href='/group/create'
              className='inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-full transition-colors'
            >
              Create Group
            </Link>
          </div>
        ) : (
          <div className='space-y-3'>
            {sortedGroups.map((group) => {
              return (
                <button
                  key={group.id}
                  onClick={() => handleNavigateToGroup(group.id)}
                  className='w-full group bg-slate-900 hover:bg-slate-800 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors flex items-center gap-4'
                >
                  {/* Icon */}
                  <div className='w-12 h-12 bg-slate-950 rounded-lg flex items-center justify-center flex-shrink-0 text-2xl'>
                    {group.emoji || (
                      <Compass className='w-6 h-6 text-slate-400' />
                    )}
                  </div>

                  {/* Info */}
                  <div className='flex-1 text-left min-w-0'>
                    <h3 className='text-base font-bold text-white group-hover:text-amber-400 transition-colors truncate'>
                      {group.name}
                    </h3>
                    <div className='flex items-center gap-3 mt-1'>
                      <span className='px-2 py-0.5 rounded bg-slate-950 border border-white/5 text-[10px] font-mono text-slate-400 flex items-center gap-1'>
                        <Code2 className='w-3 h-3' />
                        {group.code}
                      </span>
                    </div>
                  </div>

                  {/* Stats (Desktop) */}
                  <div className='hidden sm:flex items-center gap-4 mr-4'>
                    <div className='flex items-center gap-1.5 text-xs text-slate-400'>
                      <CalendarIcon className='w-3.5 h-3.5' />
                      <span>{group.trips?.length || 0} trips</span>
                    </div>
                    <div className='flex items-center gap-1.5 text-xs text-slate-400'>
                      <Users className='w-3.5 h-3.5' />
                      <span>{group.memberEmails?.length || 0} members</span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className='w-5 h-5 text-slate-600 group-hover:text-white transition-colors' />
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
