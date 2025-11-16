"use client";
import { ArrowLeft, Crown, Mail, Users, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { useGroup } from "@/src/hooks/useGroups";

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
      "bg-amber-500",
      "bg-orange-500",
      "bg-rose-500",
      "bg-pink-500",
      "bg-purple-500",
      "bg-blue-500",
      "bg-cyan-500",
      "bg-teal-500",
      "bg-emerald-500",
      "bg-lime-500",
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-slate-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-slate-600 font-medium'>Loading members...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className='min-h-screen bg-slate-50 flex items-center justify-center'>
        <div className='text-center'>
          <p className='text-slate-600 font-medium'>Group not found</p>
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
    <div className='min-h-screen bg-slate-50 p-4 md:p-8'>
      <div className='max-w-5xl mx-auto'>
        <button
          onClick={() => router.back()}
          className='mb-6 px-4 py-2 rounded-lg cursor-pointer transition-all flex items-center gap-2 font-medium text-slate-700 hover:text-slate-900 hover:bg-white/60 backdrop-blur-sm'
        >
          <ArrowLeft className='w-5 h-5' />
          Back
        </button>

        <div className='bg-white rounded-2xl shadow-lg border border-slate-200 p-6 md:p-8 mb-8'>
          <div>
            <h1 className='text-3xl md:text-4xl font-bold text-slate-900 mb-1'>
              Group Members
            </h1>
            <p className='text-slate-600 text-lg'>{group.name}</p>
          </div>
        </div>

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
                  className='group bg-white rounded-xl border border-slate-200 p-5 hover:shadow-xl hover:shadow-amber-500/10 hover:border-amber-300 transition-all duration-300 hover:-translate-y-1'
                >
                  <div className='flex flex-col gap-4'>
                    <div className='flex items-start gap-4'>
                      <div
                        className={`w-14 h-14 ${getAvatarColor(
                          index
                        )} rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}
                      >
                        {getInitials(email)}
                      </div>

                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 mb-2 flex-wrap'>
                          <h3 className='text-base font-semibold text-slate-900 truncate'>
                            {displayName(email)}
                          </h3>
                          {isCreator && (
                            <div className='flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-full border border-amber-300 dark:border-amber-700'>
                              <Crown className='w-3 h-3 text-amber-600 dark:text-amber-400' />
                              <span className='text-xs text-amber-700 dark:text-amber-300 font-medium'>
                                Creator
                              </span>
                            </div>
                          )}
                        </div>
                        <div className='flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-2'>
                          <Mail className='w-3.5 h-3.5 flex-shrink-0' />
                          <span className='truncate text-xs'>{email}</span>
                        </div>
                        {joinedDate && (
                          <div className='flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400'>
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
              <div className='bg-white rounded-xl border border-slate-200 p-12 text-center'>
                <div className='w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <Users className='w-8 h-8 text-slate-400' />
                </div>
                <p className='text-slate-600 font-medium mb-2'>
                  No members yet
                </p>
                <p className='text-slate-500 text-sm'>
                  This group does&apos;t have any members yet.
                </p>
              </div>
            </div>
          )}
        </div>

        {memberCount > 0 && (
          <div className='mt-8 text-center'>
            <div className='inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm'>
              <Users className='w-4 h-4 text-slate-500' />
              <span className='text-sm font-medium text-slate-700'>
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
