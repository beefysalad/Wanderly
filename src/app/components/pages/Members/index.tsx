"use client";
import {
  Crown,
  Users,
  Calendar,
  Loader2,
  User,
  Mail,
  Image as ImageIcon,
} from "lucide-react";
import React from "react";
import { useGroup } from "@/src/hooks/useGroups";
import Image from "next/image";
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

  if (loading) {
    return (
      <main className='min-h-screen bg-slate-950 flex items-center justify-center p-6'>
        <div className='text-center'>
          <Loader2 className='h-8 w-8 animate-spin text-slate-400 mx-auto mb-3' />
          <p className='text-sm text-slate-400'>Loading members...</p>
        </div>
      </main>
    );
  }

  if (!group) {
    return (
      <main className='min-h-screen bg-slate-950 flex items-center justify-center p-6'>
        <div className='text-center rounded-2xl border border-white/10 bg-slate-900/60 px-8 py-7'>
          <p className='text-base text-slate-300'>Group not found.</p>
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
  const members = [...(group.memberEmails || [])].sort((a, b) => {
    const aIsCreator = a === group.createdByEmail || a === group.createdBy;
    const bIsCreator = b === group.createdByEmail || b === group.createdBy;
    if (aIsCreator && !bIsCreator) return -1;
    if (!aIsCreator && bIsCreator) return 1;
    return displayName(a).localeCompare(displayName(b));
  });
  const withPhotos = members.filter(
    (email) => !!group.memberMetadata?.[email]?.imageUrl,
  ).length;
  const joinedWithDate = members.filter(
    (email) => !!group.memberMetadata?.[email]?.joinedAt,
  ).length;

  return (
    <main className='min-h-screen bg-slate-950 pb-24 text-slate-200 font-sans'>
      <PremiumPageHeader
        title='Members'
        onBack={() => router.push(`/group/${groupId}`)}
      />

      <div className='mx-auto max-w-5xl px-6 pt-10'>
        <section className='mb-6 grid gap-3 lg:grid-cols-[1.3fr_0.7fr]'>
          <div className='rounded-3xl border border-white/10 bg-slate-900/70 p-6'>
            <p className='mb-3 inline-flex items-center rounded-full border border-white/10 bg-slate-800 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-300'>
              Team Roster
            </p>
            <h1 className='text-3xl font-semibold text-white md:text-4xl'>
              {group.name} Members
            </h1>
            <p className='mt-2 max-w-xl text-sm leading-relaxed text-slate-400'>
              Everyone in this group, with creator-first ordering and member
              details in one clean view.
            </p>
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <div className='rounded-2xl border border-white/10 bg-slate-900/60 p-4'>
              <p className='text-xs text-slate-400'>Total</p>
              <p className='mt-1 text-2xl font-semibold text-white'>
                {memberCount}
              </p>
            </div>
            <div className='rounded-2xl border border-white/10 bg-slate-900/60 p-4'>
              <p className='text-xs text-slate-400'>With Photo</p>
              <p className='mt-1 text-2xl font-semibold text-white'>
                {withPhotos}
              </p>
            </div>
            <div className='col-span-2 rounded-2xl border border-white/10 bg-slate-900/60 p-4'>
              <p className='text-xs text-slate-400'>Joined Tracked</p>
              <p className='mt-1 text-2xl font-semibold text-white'>
                {joinedWithDate}
              </p>
            </div>
          </div>
        </section>

        <section className='rounded-3xl border border-white/10 bg-slate-900/40 p-3'>
          {members.length > 0 ? (
            <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
              {members.map((email, index) => {
              const isCreator =
                email === group.createdByEmail || email === group.createdBy;
              const memberMeta = group.memberMetadata?.[email];
              const joinedDate = memberMeta?.joinedAt
                ? new Date(memberMeta.joinedAt)
                : null;

              return (
                <div
                  key={email}
                  className='rounded-2xl border border-white/10 bg-slate-900/70 p-4 transition-colors hover:bg-slate-900'
                >
                  <div className='mb-3 flex items-center justify-between'>
                    <span className='rounded-md border border-white/10 bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400'>
                      #{String(index + 1).padStart(2, "0")}
                    </span>
                    {isCreator && (
                      <span className='inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-300'>
                        <Crown className='h-3 w-3' />
                        Creator
                      </span>
                    )}
                  </div>

                  <div className='flex items-start gap-3.5'>
                    {memberMeta?.imageUrl ? (
                      <div className='relative h-14 w-14 rounded-full overflow-hidden border border-white/10 flex-shrink-0'>
                        <Image
                          src={memberMeta.imageUrl}
                          alt={displayName(email)}
                          fill
                          className='object-cover'
                        />
                      </div>
                    ) : (
                      <div className='h-14 w-14 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-200 text-sm font-semibold flex-shrink-0'>
                        {email ? getInitials(email) : <User className='h-4 w-4' />}
                      </div>
                    )}

                    <div className='min-w-0 flex-1'>
                      <h3 className='truncate text-sm font-semibold text-white'>
                          {displayName(email)}
                      </h3>

                      <div className='mt-1 flex items-center gap-1.5 text-xs text-slate-400'>
                        <Mail className='h-3.5 w-3.5' />
                        <p className='truncate'>{email}</p>
                      </div>

                      <div className='mt-2 flex items-center gap-3 text-xs text-slate-500'>
                        <div className='inline-flex items-center gap-1.5'>
                          <Calendar className='h-3.5 w-3.5' />
                          <span className='whitespace-nowrap'>
                            Joined{" "}
                            {joinedDate
                              ? joinedDate.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "Unknown"}
                          </span>
                        </div>
                        <div className='inline-flex items-center gap-1.5'>
                          <ImageIcon className='h-3.5 w-3.5' />
                          <span>
                            {memberMeta?.imageUrl ? "Photo" : "No photo"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          ) : (
            <div className='rounded-2xl border border-dashed border-white/15 bg-slate-900/50 p-12 text-center'>
              <div className='mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-slate-800'>
                <Users className='h-7 w-7 text-slate-500' />
              </div>
              <p className='mb-1 text-base font-medium text-slate-200'>
                No members yet
              </p>
              <p className='text-sm text-slate-500'>
                Invite people to this group and they will appear here.
              </p>
            </div>
          )}
        </section>

        <section className='mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-4'>
          <p className='text-xs uppercase tracking-wide text-slate-500 mb-2'>
            Quick Stats
          </p>
          <div className='grid grid-cols-3 gap-3 text-center'>
            <div className='rounded-xl bg-slate-800/70 p-3'>
              <p className='text-lg font-semibold text-white'>{memberCount}</p>
              <p className='text-[11px] text-slate-400'>Members</p>
            </div>
            <div className='rounded-xl bg-slate-800/70 p-3'>
              <p className='text-lg font-semibold text-white'>{withPhotos}</p>
              <p className='text-[11px] text-slate-400'>Photos</p>
            </div>
            <div className='rounded-xl bg-slate-800/70 p-3'>
              <p className='text-lg font-semibold text-white'>
                {members.filter((email) => email === group.createdByEmail || email === group.createdBy).length}
              </p>
              <p className='text-[11px] text-slate-400'>Creators</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default MembersComponent;
