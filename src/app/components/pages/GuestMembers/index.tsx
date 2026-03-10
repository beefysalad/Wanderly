"use client";
import { ArrowLeft, Crown, Mail, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { useGroupAsGuest } from "@/src/hooks/useGroups";
import { useGuest } from "@/src/hooks/useGuest";
import LoadingState from "../../shared/LoadingState";

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
      <main className='min-h-screen bg-slate-950 p-4'>
        <LoadingState fullScreen />
      </main>
    );
  }

  if (!group) {
    return (
      <main className='min-h-screen bg-slate-950 flex items-center justify-center p-4'>
        <div className='text-center bg-slate-800/20 backdrop-blur-xl rounded-2xl shadow-xl border border-white/5 p-8 max-w-md'>
          <div className='w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4'>
            <span className='text-3xl'>😞</span>
          </div>
          <h2 className='text-xl font-bold text-white mb-2'>Group Not Found</h2>
          <p className='text-slate-400 mb-6'>
            This group doesn&apos;t exist or has been removed.
          </p>
          <button
            onClick={() => router.push("/")}
            className='px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl'
          >
            Go Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className='min-h-screen bg-slate-950 p-4 md:p-8 relative overflow-hidden'>
      {/* Background Effects */}
      <div className='absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none'>
        <div className='absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-3xl'></div>
        <div className='absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-3xl'></div>
      </div>

      <div className='max-w-5xl mx-auto relative z-10'>
        <button
          onClick={() => router.push(`/guest/group/${groupId}`)}
          className='mb-8 p-2 -ml-2 rounded-xl hover:bg-white/5 transition-colors inline-flex items-center gap-2 text-slate-400 hover:text-white group'
        >
          <ArrowLeft className='w-5 h-5 transition-transform group-hover:-translate-x-1' />
          <span className='font-medium'>Back</span>
        </button>

        <div className='bg-slate-800/20 backdrop-blur-xl border border-white/5 rounded-2xl p-6 md:p-10 mb-8'>
          <div className='flex flex-col md:flex-row md:items-end justify-between gap-6'>
            <div>
              <div className='flex items-center gap-2 mb-4'>
                <span className='px-3 py-1 bg-amber-500/10 text-amber-400 rounded-lg text-[10px] font-bold border border-amber-500/20 uppercase tracking-tighter'>
                  {guestSession?.guestName?.toUpperCase() || "GUEST"}
                </span>
                <span className='px-3 py-1 bg-slate-500/10 text-slate-400 rounded-lg text-[10px] font-bold border border-white/5 uppercase tracking-tighter'>
                  VIEWING MEMBERS
                </span>
              </div>
              <h1 className='text-4xl font-bold text-white mb-2 leading-tight'>
                Group Members
              </h1>
              <p className='text-slate-400 text-lg'>{group.name}</p>
            </div>

            <div className='inline-flex items-center gap-3 px-4 py-2 bg-slate-900/40 rounded-xl border border-white/5'>
              <Users className='w-5 h-5 text-amber-400' />
              <div className='flex flex-col'>
                <span className='text-xs font-bold text-white uppercase tracking-tighter'>
                  Total
                </span>
                <span className='text-sm font-medium text-slate-400'>
                  {group.memberEmails?.length || 0} collaborators
                </span>
              </div>
            </div>
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
                  className='group bg-slate-800/20 backdrop-blur-xl rounded-2xl border border-white/5 p-6 hover:bg-slate-800/40 hover:border-amber-500/30 transition-all duration-300 active:scale-[0.98]'
                >
                  <div className='flex flex-col gap-4'>
                    <div className='flex items-center gap-4'>
                      <div
                        className={`w-14 h-14 ${getAvatarColor(
                          index,
                        )} rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-300 relative overflow-hidden`}
                      >
                        <div className='absolute inset-0 bg-black/10'></div>
                        <span className='relative z-10'>
                          {getInitials(email)}
                        </span>
                      </div>

                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 mb-1 flex-wrap'>
                          <h3 className='text-lg font-bold text-white truncate'>
                            {memberName}
                          </h3>
                        </div>
                        {isCreator && (
                          <div className='inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 rounded-lg border border-amber-500/20'>
                            <Crown className='w-3 h-3 text-amber-400' />
                            <span className='text-[10px] text-amber-400 font-bold uppercase tracking-wider'>
                              Creator
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className='flex items-center gap-2 text-xs text-slate-500 bg-white/5 p-2 rounded-xl border border-white/5'>
                      <Mail className='w-3.5 h-3.5 flex-shrink-0' />
                      <span
                        className='truncate select-none font-medium'
                        style={{ filter: "blur(6px)" }}
                        title='Email hidden for privacy'
                      >
                        {email}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className='col-span-full'>
              <div className='bg-slate-800/10 backdrop-blur-sm rounded-2xl border border-white/5 py-20 text-center'>
                <div className='w-20 h-20 bg-slate-800/40 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/5'>
                  <Users className='w-10 h-10 text-slate-500' />
                </div>
                <h3 className='text-xl font-bold text-white mb-2'>
                  No members yet
                </h3>
                <p className='text-slate-400 max-w-xs mx-auto text-sm'>
                  This group doesn&apos;t have any members yet.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default GuestMembersComponent;
