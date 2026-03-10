"use client";

import { Crown, Loader2, Mail, Plus, Trash2, User, Users } from "lucide-react";
import Image from "next/image";
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

interface IMembersComponent {
  groupId: string;
}

type TaskStatus = "not_started" | "in_progress" | "done";

const STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  done: "Done",
};

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

  const getInitials = (email: string) => email.substring(0, 2).toUpperCase();

  const displayName = useCallback(
    (email: string) =>
      group?.memberNames?.[email] ||
      group?.memberMetadata?.[email]?.name ||
      email.split("@")[0],
    [group?.memberMetadata, group?.memberNames],
  );

  const members = useMemo(() => {
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

  const openTasks = tasks.filter((task) => task.status !== "done").length;
  const memberCount = members.length;

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
        <div className='text-center rounded-2xl border border-slate-800 bg-slate-900 px-8 py-7'>
          <p className='text-base text-slate-300'>Group not found.</p>
        </div>
      </main>
    );
  }

  return (
    <main className='min-h-screen bg-slate-950 pb-24 text-slate-200 font-sans'>
      <PremiumPageHeader
        title='Members'
        onBack={() => router.push(`/group/${groupId}`)}
      />

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

        <section className='mb-6 border border-slate-800 rounded-2xl bg-slate-900 p-4 sm:p-5'>
          <div className='mb-3 flex items-center gap-2'>
            <Plus className='h-4 w-4 text-amber-400' />
            <h2 className='text-base font-semibold text-white'>Assign Task</h2>
          </div>

          <form onSubmit={onAssignTask} className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='Task title'
              className='h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500'
              required
            />

            <select
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              className='h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-slate-500'
              required
            >
              <option value=''>Assign to member</option>
              {members.map((email) => {
                const userId = group.memberIds?.[email];
                if (!userId) return null;
                return (
                  <option key={email} value={userId}>
                    {displayName(email)}
                  </option>
                );
              })}
            </select>

            <input
              type='date'
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className='h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-slate-500'
            />

            <button
              type='submit'
              disabled={createTask.isPending}
              className='h-11 rounded-xl bg-amber-500 text-slate-950 text-sm font-semibold transition hover:bg-amber-400 disabled:opacity-60'
            >
              {createTask.isPending ? "Assigning..." : "Assign Task"}
            </button>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='Optional notes'
              className='sm:col-span-2 min-h-[84px] rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 resize-none'
            />
          </form>
        </section>

        <section className='mb-6 border border-slate-800 rounded-2xl bg-slate-900 p-3 sm:p-4'>
          <h2 className='px-1 pb-3 text-sm font-semibold text-white'>Members</h2>

          {members.length === 0 ? (
            <div className='rounded-xl border border-dashed border-slate-700 p-8 text-center'>
              <Users className='mx-auto h-6 w-6 text-slate-500 mb-2' />
              <p className='text-sm text-slate-400'>No members yet.</p>
            </div>
          ) : (
            <div className='space-y-2'>
              {members.map((email) => {
                const isCreator =
                  email === group.createdByEmail || email === group.createdBy;
                const memberMeta = group.memberMetadata?.[email];
                const userId = group.memberIds?.[email];
                const memberTaskCount = userId
                  ? tasks.filter((task) => task.assignedToId === userId && task.status !== "done")
                      .length
                  : 0;

                return (
                  <div
                    key={email}
                    className='flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 px-3 py-3'
                  >
                    {memberMeta?.imageUrl ? (
                      <div className='relative h-11 w-11 overflow-hidden rounded-full border border-slate-700'>
                        <Image
                          src={memberMeta.imageUrl}
                          alt={displayName(email)}
                          fill
                          className='object-cover'
                        />
                      </div>
                    ) : (
                      <div className='flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-xs font-semibold text-slate-200'>
                        {email ? getInitials(email) : <User className='h-4 w-4' />}
                      </div>
                    )}

                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center gap-2'>
                        <p className='truncate text-sm font-medium text-white'>
                          {displayName(email)}
                        </p>
                        {isCreator && (
                          <span className='inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300'>
                            <Crown className='h-3 w-3' />
                            Creator
                          </span>
                        )}
                      </div>
                      <div className='mt-0.5 flex items-center gap-1.5 text-xs text-slate-400'>
                        <Mail className='h-3.5 w-3.5' />
                        <span className='truncate'>{email}</span>
                      </div>
                    </div>

                    <div className='rounded-lg border border-slate-700 px-2.5 py-1 text-xs text-slate-300'>
                      {memberTaskCount} open
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className='border border-slate-800 rounded-2xl bg-slate-900 p-3 sm:p-4'>
          <h2 className='px-1 pb-3 text-sm font-semibold text-white'>All Tasks</h2>

          {tasksLoading ? (
            <div className='p-6 text-sm text-slate-400'>Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className='rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400'>
              No tasks yet. Assign one above.
            </div>
          ) : (
            <div className='space-y-2'>
              {tasks.map((task) => {
                const assigneeEmail = emailByUserId[task.assignedToId];
                const assigneeName = assigneeEmail
                  ? displayName(assigneeEmail)
                  : "Unknown member";

                return (
                  <div
                    key={task.id}
                    className='rounded-xl border border-slate-800 bg-slate-950 px-3 py-3'
                  >
                    <div className='flex flex-wrap items-start justify-between gap-2'>
                      <div className='min-w-0'>
                        <p className='truncate text-sm font-medium text-white'>{task.title}</p>
                        <p className='mt-0.5 text-xs text-slate-400'>Assigned to {assigneeName}</p>
                        {task.notes && (
                          <p className='mt-1 text-xs text-slate-500 line-clamp-2'>{task.notes}</p>
                        )}
                      </div>

                      <button
                        onClick={() => deleteTask.mutate(task.id)}
                        disabled={deleteTask.isPending}
                        className='rounded-lg border border-slate-700 p-2 text-slate-500 hover:text-red-300 hover:border-red-500/40 transition-colors'
                        aria-label='Delete task'
                        type='button'
                      >
                        <Trash2 className='h-4 w-4' />
                      </button>
                    </div>

                    <div className='mt-3 flex flex-wrap items-center gap-2'>
                      <select
                        value={task.status}
                        onChange={(e) =>
                          updateTask.mutate({
                            taskId: task.id,
                            status: e.target.value as TaskStatus,
                          })
                        }
                        className='h-8 rounded-lg border border-slate-700 bg-slate-900 px-2 text-xs text-slate-200'
                      >
                        <option value='not_started'>{STATUS_LABELS.not_started}</option>
                        <option value='in_progress'>{STATUS_LABELS.in_progress}</option>
                        <option value='done'>{STATUS_LABELS.done}</option>
                      </select>

                      {task.dueDate && (
                        <span className='text-xs text-slate-500'>
                          Due {new Date(task.dueDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default MembersComponent;
