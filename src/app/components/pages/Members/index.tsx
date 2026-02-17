"use client";
import { Crown, Users, Calendar, ArrowLeft } from "lucide-react";
import React from "react";
import { useGroup } from "@/src/hooks/useGroups";
import Image from "next/image";
import PremiumBackground from "../../shared/PremiumBackground";
import PremiumPageHeader from "../../shared/PremiumPageHeader";
import { useRouter } from "next/navigation";

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
      <main className='min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden'>
        <PremiumBackground />
        <div className='text-center relative z-10'>
          <div className='relative w-20 h-20 mx-auto mb-6'>
            <div className='absolute inset-0 border-4 border-slate-800 rounded-full'></div>
            <div className='absolute inset-0 border-4 border-t-orange-500 rounded-full animate-spin'></div>
          </div>
          <p className='text-slate-400 font-bold tracking-tight uppercase tracking-widest text-[10px]'>
            Loading members...
          </p>
        </div>
      </main>
    );
  }

  if (!group) {
    return (
      <main className='min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden'>
        <PremiumBackground />
        <div className='text-center relative z-10'>
          <p className='text-slate-400 font-black uppercase tracking-widest text-xs'>Group not found</p>
        </div>
      </main>
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
    <main className='min-h-screen bg-slate-950 pb-24 text-slate-200 relative overflow-x-hidden selection:bg-purple-500/30 font-sans'>
      <PremiumBackground />
      
      <PremiumPageHeader 
        title='Travel Companions'
        onBack={() => router.push(`/group/${groupId}`)}
      />

      <div className='max-w-4xl mx-auto px-6 pt-12 relative z-10'>
        {/* Page title and description */}
        <div className="mb-12">
          <h1 className='text-4xl font-black text-white mb-2 tracking-tight uppercase'>
            The <span className='text-orange-500'>Crew</span>
          </h1>
          <p className='text-slate-400 text-lg font-medium'>
            Everyone heading to {group.name}.
          </p>
        </div>

        {/* Members Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
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
                  className='group relative bg-white/5 backdrop-blur-3xl rounded-3xl border border-white/5 p-6 hover:bg-white/10 hover:border-orange-500/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-orange-500/10'
                >
                  <div className='flex flex-col gap-6'>
                    <div className='flex items-start gap-5'>
                      {memberMeta?.imageUrl ? (
                        <div className='relative w-16 h-16 rounded-2xl overflow-hidden border border-white/10 shadow-xl flex-shrink-0 group-hover:scale-110 group-hover:border-orange-500/50 transition-all duration-500'>
                          <Image
                            src={memberMeta.imageUrl}
                            alt={displayName(email)}
                            fill
                            className='object-cover'
                          />
                        </div>
                      ) : (
                        <div
                          className={`w-16 h-16 bg-gradient-to-br ${getAvatarColor(
                            index,
                          )} rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-500`}
                        >
                          {getInitials(email)}
                        </div>
                      )}

                      <div className='flex-1 min-w-0'>
                        <div className='flex flex-col gap-1 mb-3'>
                          <h3 className='text-sm font-black text-white truncate uppercase tracking-widest group-hover:text-orange-400 transition-colors'>
                            {displayName(email)}
                          </h3>
                          {isCreator && (
                            <div className='inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 rounded-full border border-amber-500/30 w-max'>
                              <Crown className='w-2.5 h-2.5 text-amber-400' />
                              <span className='text-[8px] text-amber-300 font-black uppercase tracking-widest'>
                                Creator
                              </span>
                            </div>
                          )}
                        </div>

                        {joinedDate && (
                          <div className='flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest'>
                            <Calendar className='w-3 h-3 text-orange-500/60' />
                            <span>
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
                  
                  {/* Decorative corner element */}
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
                  </div>
                </div>
              );
            })
          ) : (
            <div className='col-span-full'>
              <div className='bg-white/5 backdrop-blur-3xl rounded-3xl border border-white/5 p-16 text-center shadow-inner'>
                <div className='w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/5'>
                  <Users className='w-10 h-10 text-slate-600' />
                </div>
                <p className='text-white font-black uppercase tracking-[0.2em] text-xs mb-2'>
                  Lone Explorer
                </p>
                <p className='text-slate-500 text-[10px] font-medium uppercase tracking-widest'>
                  This group doesn&apos;t have any members yet.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Member Count Badge (Redesigned) */}
        {memberCount > 0 && (
          <div className='mt-16 text-center'>
            <div className='inline-flex items-center gap-3 px-6 py-3 bg-white/5 backdrop-blur-3xl rounded-full border border-white/10 shadow-2xl group transition-all hover:bg-white/10'>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className='text-[10px] font-black text-white uppercase tracking-[0.3em]'>
                {memberCount} {memberCount === 1 ? "Active Explorer" : "Active Explorers"}
              </span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default MembersComponent;
