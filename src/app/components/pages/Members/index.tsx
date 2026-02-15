"use client";
import { ArrowLeft, Crown, Mail, Users, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { useGroup } from "@/src/hooks/useGroups";
import Image from "next/image";
import DashboardLayoutHeader from "../../shared/DashboardLayoutHeader";

interface IMembersComponent {
  groupId: string;
}
const MembersComponent = ({ groupId }: IMembersComponent) => {
  const router = useRouter();
  const { data: groupData, isLoading: loading } = useGroup(groupId);
  const group = groupData?.group || null;

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };
  const getAvatarColor = (index: number) => {
    const colors = [
      "from-amber-500 to-orange-500",
      "from-orange-500 to-red-500",
      "from-rose-500 to-pink-500",
      "from-pink-500 to-purple-500",
      "from-purple-500 to-indigo-500",
      "from-blue-500 to-cyan-500",
      "from-cyan-500 to-teal-500",
      "from-teal-500 to-emerald-500",
      "from-emerald-500 to-green-500",
      "from-lime-500 to-yellow-500",
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <main className='min-h-screen bg-slate-950 flex items-center justify-center p-6'>
        <div className='text-center'>
          <div className='relative w-20 h-20 mx-auto mb-6'>
            <div className='absolute inset-0 border-4 border-slate-800 rounded-full'></div>
            <div className='absolute inset-0 border-4 border-t-orange-500 rounded-full animate-spin'></div>
          </div>
          <p className='text-slate-400 font-bold tracking-tight'>
            Loading members...
          </p>
        </div>
      </main>
    );
  }

  if (!group) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center'>
        <div className='text-center'>
          <p className='text-slate-400 font-medium'>Group not found</p>
        </div>
      </div>
    );
  }

  const memberCount = group.memberEmails?.length || 0;
  const displayName = (email: string) => {
    return (
      group.memberNames?.[email] ||
      group.memberMetadata?.[email]?.name ||
      email.split("@")[0]
    );
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8'>
      <div className='max-w-4xl mx-auto px-4 py-6 relative z-10'>
        <DashboardLayoutHeader
          showBack={true}
          title='Group Members'
          description={group.name}
          sticky={true}
        />

        {/* Members Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6'>
          {group.memberEmails && group.memberEmails.length > 0 ? (
            group.memberEmails.map((email, index) => {
              const isCreator =
                email === group.createdByEmail || email === group.createdBy;
              const memberMeta = group.memberMetadata?.[email];
              const joinedDate = memberMeta?.joinedAt
                ? new Date(memberMeta.joinedAt)
                : null;

              return (
                <div
                  key={email}
                  className='group bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-white/10 p-5 hover:bg-slate-800/60 hover:border-orange-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-500/10'
                >
                  <div className='flex flex-col gap-4'>
                    <div className='flex items-start gap-4'>
                      {memberMeta?.imageUrl ? (
                        <div className='relative w-14 h-14 rounded-full overflow-hidden border-2 border-white/10 shadow-lg flex-shrink-0 group-hover:scale-110 group-hover:border-orange-500/50 transition-all duration-300'>
                          <Image
                            src={memberMeta.imageUrl}
                            alt={displayName(email)}
                            fill
                            className='object-cover'
                          />
                        </div>
                      ) : (
                        <div
                          className={`w-14 h-14 bg-gradient-to-br ${getAvatarColor(
                            index,
                          )} rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}
                        >
                          {getInitials(email)}
                        </div>
                      )}

                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 mb-2 flex-wrap'>
                          <h3 className='text-base font-semibold text-white truncate'>
                            {displayName(email)}
                          </h3>
                          {isCreator && (
                            <div className='flex items-center gap-1 px-2 py-1 bg-amber-500/10 rounded-full border border-amber-500/30'>
                              <Crown className='w-3 h-3 text-amber-400' />
                              <span className='text-xs text-amber-300 font-medium'>
                                Creator
                              </span>
                            </div>
                          )}
                        </div>

                        {joinedDate && (
                          <div className='flex items-center gap-2 text-xs text-slate-500'>
                            <Calendar className='w-3.5 h-3.5 flex-shrink-0' />
                            <span>
                              Joined{" "}
                              {joinedDate.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className='col-span-full'>
              <div className='bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-white/10 p-12 text-center'>
                <div className='w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <Users className='w-8 h-8 text-slate-400' />
                </div>
                <p className='text-slate-300 font-medium mb-2'>
                  No members yet
                </p>
                <p className='text-slate-500 text-sm'>
                  This group doesn&apos;t have any members yet.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Member Count Badge */}
        {memberCount > 0 && (
          <div className='mt-8 text-center'>
            <div className='inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 backdrop-blur-xl rounded-full border border-white/10 shadow-lg'>
              <Users className='w-4 h-4 text-slate-400' />
              <span className='text-sm font-medium text-slate-300'>
                {memberCount} {memberCount === 1 ? "Member" : "Members"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MembersComponent;
