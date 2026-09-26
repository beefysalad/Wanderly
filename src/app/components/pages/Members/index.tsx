"use client";

import { useRouter } from "next/navigation";
import React, { useCallback, useMemo } from "react";
import PremiumPageHeader from "../../shared/PremiumPageHeader";
import { useGroup } from "@/src/hooks/useGroups";
import LoadingState from "../../shared/LoadingState";
import { MembersList } from "./components/MembersList";

interface IMembersComponent {
  groupId: string;
}

const MembersComponent = ({ groupId }: IMembersComponent) => {
  const router = useRouter();
  const { data: groupData, isLoading: loading } = useGroup(groupId);
  const group = groupData?.group || null;

  const displayName = useCallback(
    (email: string) =>
      group?.memberNames?.[email] ||
      group?.memberMetadata?.[email]?.name ||
      email.split("@")[0],
    [group?.memberMetadata, group?.memberNames],
  );

  const memberEmails = useMemo(() => {
    if (!group?.memberEmails) return [];

    return [...group.memberEmails].sort((a, b) => {
      const aIsCreator = a === group.createdByEmail || a === group.createdBy;
      const bIsCreator = b === group.createdByEmail || b === group.createdBy;
      if (aIsCreator && !bIsCreator) return -1;
      if (!aIsCreator && bIsCreator) return 1;
      return displayName(a).localeCompare(displayName(b));
    });
  }, [displayName, group?.createdBy, group?.createdByEmail, group?.memberEmails]);

  const memberRows = useMemo(
    () =>
      memberEmails.map((email) => {
        const isCreator = email === group?.createdByEmail || email === group?.createdBy;
        const memberMeta = group?.memberMetadata?.[email];

        return {
          email,
          displayName: displayName(email),
          isCreator,
          imageUrl: memberMeta?.imageUrl,
        };
      }),
    [displayName, group?.createdBy, group?.createdByEmail, group?.memberMetadata, memberEmails],
  );

  const memberCount = memberEmails.length;

  if (loading) {
    return (
      <main className='min-h-screen bg-slate-950 p-6'>
        <LoadingState fullScreen />
      </main>
    );
  }

  if (!group) {
    return (
      <main className='min-h-screen bg-slate-950 flex items-center justify-center p-6'>
        <div className='text-center rounded-2xl border border-slate-800 bg-slate-900 px-8 py-7'>
          <p className='text-base text-slate-300'>Group not found.</p>
        </div>
      </main>
    );
  }

  return (
    <main className='min-h-screen bg-slate-950 pb-24 text-slate-200 font-sans'>
      <PremiumPageHeader title='Members' onBack={() => router.push(`/group/${groupId}`)} />

      <div className='mx-auto max-w-5xl px-4 pt-6 sm:px-6'>
        <section className='mb-6 border border-slate-800 rounded-2xl bg-slate-900 p-5'>
          <p className='text-xs uppercase tracking-[0.14em] text-slate-500'>Team</p>
          <h1 className='mt-2 text-2xl sm:text-3xl font-semibold text-white'>
            {group.name} Members
          </h1>
          <p className='mt-2 text-sm text-slate-400'>
            Everyone planning this trip together.
          </p>

          <div className='mt-4 grid grid-cols-1 gap-2'>
            <div className='rounded-xl border border-slate-800 px-3 py-3'>
              <p className='text-[11px] uppercase tracking-[0.12em] text-slate-500'>Members</p>
              <p className='mt-1 text-xl font-semibold text-white'>{memberCount}</p>
            </div>
          </div>
        </section>

        <MembersList members={memberRows} />
      </div>
    </main>
  );
};

export default MembersComponent;
