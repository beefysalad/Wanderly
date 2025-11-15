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
      <main className='min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/40 to-amber-50/50 flex items-center justify-center'>
        <div className='text-center bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 p-8'>
          <div className='w-12 h-12 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-slate-700 font-medium'>Loading members...</p>
        </div>
      </main>
    );
  }

  if (!group) {
    return (
      <main className='min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/40 to-amber-50/50 flex items-center justify-center p-4'>
        <div className='text-center bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 p-8 max-w-md'>
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
            className='px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl transition-all font-semibold shadow-md hover:shadow-lg'
          >
            Go Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className='min-h-screen pb-20'>
      <div className='max-w-4xl mx-auto px-4 py-6'>
        <button
          onClick={() => router.push(`/guest/group/${groupId}`)}
          className='mb-6 px-3 py-2 rounded-lg cursor-pointer transition-all flex items-center gap-2 font-medium'
        >
          <ArrowLeft className='w-5 h-5' />
          Back
        </button>

        <div className='bg-gradient-to-br from-white via-orange-50/50 to-amber-50/30 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 sm:p-8 mb-8 relative overflow-hidden'>
          <div className='absolute inset-0 bg-white/60 backdrop-blur-md -z-0'></div>
          <div className='relative z-10'>
            <div className='flex items-center gap-3 mb-2'>
              <div className='w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center backdrop-blur-sm shadow-lg'>
                <Users className='w-6 h-6 text-white' />
              </div>
              <div>
                <h1 className='text-3xl font-bold text-slate-900'>
                  Group Members
                </h1>
                <p className='text-slate-600'>{group.name}</p>
              </div>
            </div>
            {guestSession && (
              <p className='text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-lg inline-flex items-center gap-2 mt-2'>
                <Users className='w-4 h-4' />
                Viewing as Guest: {guestSession.guestName}
              </p>
            )}
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {group.memberEmails && group.memberEmails.length > 0 ? (
            group.memberEmails.map((email, index) => {
              const isCreator = email === group.createdBy;
              const memberName =
                group.memberNames?.[email] || email.split("@")[0];

              return (
                <div
                  key={email}
                  className='bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-6 hover:bg-white hover:border-orange-300 transition-all duration-300 hover:shadow-lg shadow-sm'
                >
                  <div className='flex items-center gap-4'>
                    <div
                      className={`w-16 h-16 ${getAvatarColor(
                        index
                      )} rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md`}
                    >
                      {getInitials(email)}
                    </div>

                    <div className='flex-1'>
                      <div className='flex items-center gap-2 mb-1'>
                        <h3 className='text-lg font-semibold text-slate-900'>
                          {memberName}
                        </h3>
                        {isCreator && (
                          <div className='flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 rounded-full border border-amber-500/50'>
                            <Crown className='w-3 h-3 text-amber-600' />
                            <span className='text-xs text-amber-600 font-medium'>
                              Creator
                            </span>
                          </div>
                        )}
                      </div>
                      <div className='flex items-center gap-2 text-sm text-slate-600'>
                        <Mail className='w-4 h-4' />
                        <span
                          className='truncate select-none'
                          style={{ filter: "blur(4px)" }}
                          title='Email hidden for privacy'
                        >
                          {email}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className='col-span-full text-center py-12 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 p-8'>
              <Users className='w-12 h-12 text-slate-300 mx-auto mb-3' />
              <p className='text-slate-500'>No members in this group yet</p>
            </div>
          )}
        </div>

        <div className='mt-6 text-center text-slate-400 text-sm bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200'>
          Total Members: {group.memberEmails?.length || 0}
        </div>
      </div>
    </main>
  );
};

export default GuestMembersComponent;
