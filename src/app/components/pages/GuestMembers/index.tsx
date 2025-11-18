"use client";
import { ArrowLeft, Crown, Mail, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { useGroupAsGuest } from "@/src/hooks/useGroups";
import { useGuest } from "@/src/hooks/useGuest";

interface IGuestMembersComponent {
  groupId: string;
}

const GuestMembersComponent = ({ groupId }: IGuestMembersComponent) => {
  const router = useRouter();
  const guestSession = useGuest();
  const { data: groupData, isLoading: loading } = useGroupAsGuest(groupId);
  const group = groupData || null;

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
      <main className='min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/30 flex items-center justify-center'>
        <div className='text-center bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 p-8'>
          <div className='w-16 h-16 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-slate-600 font-medium'>Loading members...</p>
        </div>
      </main>
    );
  }

  if (!group) {
    return (
      <main className='min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/30 flex items-center justify-center p-4'>
        <div className='text-center bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-200 max-w-md'>
          <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <span className='text-3xl'>😞</span>
          </div>
          <h2 className='text-xl font-bold text-slate-900 mb-2'>
            Group Not Found
          </h2>
          <p className='text-slate-600 mb-6'>
            This group doesn&apos;t exist or has been removed.
          </p>
          <button
            onClick={() => router.push("/")}
            className='px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
          >
            Go Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className='min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/30 p-4 md:p-8'>
      <div className='max-w-5xl mx-auto'>
        <button
          onClick={() => router.push(`/guest/group/${groupId}`)}
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
            {guestSession && (
              <p className='text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-lg inline-flex items-center gap-2 mt-2'>
                <Users className='w-4 h-4' />
                Viewing as Guest: {guestSession.guestName}
              </p>
            )}
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6'>
          {group.memberEmails && group.memberEmails.length > 0 ? (
            group.memberEmails.map((email, index) => {
              const isCreator = email === group.createdBy;
              const memberName =
                group.memberNames?.[email] || email.split("@")[0];

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
                        )} rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}
                      >
                        {getInitials(email)}
                      </div>

                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 mb-2 flex-wrap'>
                          <h3 className='text-base font-semibold text-slate-900 truncate'>
                            {memberName}
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
                          <span
                            className='truncate text-xs select-none'
                            style={{ filter: "blur(4px)" }}
                            title='Email hidden for privacy'
                          >
                            {email}
                          </span>
                        </div>
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
                  This group doesn&apos;t have any members yet.
                </p>
              </div>
            </div>
          )}
        </div>

        {group.memberEmails && group.memberEmails.length > 0 && (
          <div className='mt-8 text-center'>
            <div className='inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm'>
              <Users className='w-4 h-4 text-slate-500' />
              <span className='text-sm font-medium text-slate-700'>
                {group.memberEmails.length}{" "}
                {group.memberEmails.length === 1 ? "Member" : "Members"}
              </span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default GuestMembersComponent;
