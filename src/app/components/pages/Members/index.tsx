"use client";

import { useRouter } from "next/navigation";
import React, { useCallback, useMemo, useState } from "react";
import PremiumPageHeader from "../../shared/PremiumPageHeader";
import { useGroup } from "@/src/hooks/useGroups";
import {
  useCreateMemberTask,
  useDeleteMemberTask,
  useMemberTasks,
  useUpdateMemberTask,
} from "@/src/hooks/useMemberTasks";
import LoadingState from "../../shared/LoadingState";
import { AssignTaskForm } from "./components/AssignTaskForm";
import { MembersList } from "./components/MembersList";
import { TasksList } from "./components/TasksList";

interface IMembersComponent {
  groupId: string;
}

const MembersComponent = ({ groupId }: IMembersComponent) => {
  const router = useRouter();
  const { data: groupData, isLoading: loading } = useGroup(groupId);
  const { data: tasksData, isLoading: tasksLoading } = useMemberTasks(groupId);
  const createTask = useCreateMemberTask(groupId);
  const updateTask = useUpdateMemberTask(groupId);
  const deleteTask = useDeleteMemberTask(groupId);

  const group = groupData?.group || null;
  const tasks = useMemo(() => tasksData?.tasks ?? [], [tasksData?.tasks]);

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignedToId, setAssignedToId] = useState("");

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

  const emailByUserId = useMemo(() => {
    const map: Record<string, string> = {};
    if (!group?.memberIds) return map;

    for (const [email, userId] of Object.entries(group.memberIds)) {
      if (userId) map[userId] = email;
    }

    return map;
  }, [group?.memberIds]);

  const formMembers = useMemo(
    () =>
      memberEmails.flatMap((email) => {
        const userId = group?.memberIds?.[email];
        if (!userId) return [];
        return [{ userId, email, displayName: displayName(email) }];
      }),
    [displayName, group?.memberIds, memberEmails],
  );

  const memberRows = useMemo(
    () =>
      memberEmails.map((email) => {
        const isCreator = email === group?.createdByEmail || email === group?.createdBy;
        const memberMeta = group?.memberMetadata?.[email];
        const userId = group?.memberIds?.[email];
        const openTaskCount = userId
          ? tasks.filter((task) => task.assignedToId === userId && task.status !== "done").length
          : 0;

        return {
          email,
          displayName: displayName(email),
          isCreator,
          imageUrl: memberMeta?.imageUrl,
          openTaskCount,
        };
      }),
    [displayName, group?.createdBy, group?.createdByEmail, group?.memberIds, group?.memberMetadata, memberEmails, tasks],
  );

  const assigneeNameFor = useCallback(
    (task: (typeof tasks)[number]) => {
      const assigneeEmail = emailByUserId[task.assignedToId];
      return assigneeEmail ? displayName(assigneeEmail) : "Unknown member";
    },
    [displayName, emailByUserId],
  );

  const openTasks = tasks.filter((task) => task.status !== "done").length;
  const memberCount = memberEmails.length;

  const onAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignedToId || !title.trim()) return;

    await createTask.mutateAsync({
      assignedToId,
      title: title.trim(),
      notes: notes.trim() || undefined,
      dueDate: dueDate || undefined,
    });

    setTitle("");
    setNotes("");
    setDueDate("");
    setAssignedToId("");
  };

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
            Keep responsibilities visible and aligned for everyone.
          </p>

          <div className='mt-4 grid grid-cols-3 gap-2'>
            <div className='rounded-xl border border-slate-800 px-3 py-3'>
              <p className='text-[11px] uppercase tracking-[0.12em] text-slate-500'>Members</p>
              <p className='mt-1 text-xl font-semibold text-white'>{memberCount}</p>
            </div>
            <div className='rounded-xl border border-slate-800 px-3 py-3'>
              <p className='text-[11px] uppercase tracking-[0.12em] text-slate-500'>Tasks</p>
              <p className='mt-1 text-xl font-semibold text-white'>{tasks.length}</p>
            </div>
            <div className='rounded-xl border border-slate-800 px-3 py-3'>
              <p className='text-[11px] uppercase tracking-[0.12em] text-slate-500'>Open</p>
              <p className='mt-1 text-xl font-semibold text-white'>{openTasks}</p>
            </div>
          </div>
        </section>

        <AssignTaskForm
          title={title}
          onTitleChange={setTitle}
          notes={notes}
          onNotesChange={setNotes}
          dueDate={dueDate}
          onDueDateChange={setDueDate}
          assignedToId={assignedToId}
          onAssignedToIdChange={setAssignedToId}
          members={formMembers}
          isSubmitting={createTask.isPending}
          onSubmit={onAssignTask}
        />

        <MembersList members={memberRows} />

        <TasksList
          tasks={tasks}
          isLoading={tasksLoading}
          assigneeNameFor={assigneeNameFor}
          onStatusChange={(taskId, status) => updateTask.mutate({ taskId, status })}
          onDelete={(taskId) => deleteTask.mutate(taskId)}
          isDeleting={deleteTask.isPending}
        />
      </div>
    </main>
  );
};

export default MembersComponent;
