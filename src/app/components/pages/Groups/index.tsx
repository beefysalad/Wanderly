"use client";

import { Plus } from "lucide-react";
import { useMemo } from "react";
import { useGroups } from "@/src/hooks/useGroups";
import { AppShell } from "../../shared/AppShell/AppShell";
import { PageHeading } from "../../shared/AppShell/PageHeading";
import LoadingState from "../../shared/LoadingState";
import { PillLink } from "../../shared/Pills";
import { GroupCard } from "./GroupCard";

const GroupsComponent = () => {
  const { data, isLoading } = useGroups();
  const today = useMemo(() => new Date(), []);

  const groups = useMemo(
    () =>
      [...(data?.groups ?? [])].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [data],
  );

  return (
    <AppShell>
      <div className='flex flex-col gap-[26px]'>
        <PageHeading
          eyebrow={`${groups.length} ${groups.length === 1 ? "group" : "groups"}`}
          title='Groups'
          actions={
            <>
              <PillLink href='/group/create'>
                <Plus className='size-[14px]' strokeWidth={2.4} />
                Create group
              </PillLink>
              <PillLink href='/group/join' variant='ghost'>
                Join with code
              </PillLink>
            </>
          }
        />

        {isLoading ? <LoadingState className='py-24' /> : null}

        {!isLoading && groups.length === 0 ? (
          <div className='rounded-[22px] border border-dashed border-white/[.14] bg-[rgba(15,23,42,.4)] p-10 text-center'>
            <h2 className='mb-2 text-xl font-bold'>No groups yet</h2>
            <p className='mx-auto max-w-md text-[#94a3b8]'>
              Create one to start planning, or ask a friend for their invite code.
            </p>
          </div>
        ) : null}

        <div className='grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-[14px]'>
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} today={today} />
          ))}
        </div>
      </div>
    </AppShell>
  );
};

export default GroupsComponent;
