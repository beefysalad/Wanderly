"use client";

import {
  Calendar,
  Crown,
  Loader2,
  Mail,
  Plus,
  Trash2,
  User,
  Users,
} from "lucide-react";
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

  const memberTasksByUserId = useMemo(() => {
    return tasks.reduce(
      (acc, task) => {
        if (!acc[task.assignedToId]) acc[task.assignedToId] = [];
        acc[task.assignedToId].push(task);
        return acc;
      },
      {} as Record<string, typeof tasks>,
    );
  }, [tasks]);

  const withPhotos = members.filter(
    (email) => !!group?.memberMetadata?.[email]?.imageUrl,
  ).length;

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
        <div className='text-center rounded-2xl border border-white/10 bg-slate-900/60 px-8 py-7'>
          <p className='text-base text-slate-300'>Group not found.</p>
        </div>
      </main>
    );
  }

  const memberCount = members.length;

  return (
    <main className='min-h-screen bg-slate-950 pb-24 text-slate-200 font-sans'>
      <PremiumPageHeader
        title='Members'
        onBack={() => router.push(`/group/${groupId}`)}
      />

      <div className='mx-auto max-w-6xl px-6 pt-10'>
        <section className='mb-6 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]'>
          <div className='rounded-3xl border border-white/10 bg-slate-900/70 p-6'>
            <p className='mb-3 inline-flex items-center rounded-full border border-white/10 bg-slate-800 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-300'>
              Team Roster
            </p>
            <h1 className='text-3xl font-semibold text-white md:text-4xl'>
              {group.name} Members
            </h1>
            <p className='mt-2 max-w-xl text-sm leading-relaxed text-slate-400'>
              Assign responsibilities and keep ownership clear while planning.
            </p>
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <div className='rounded-2xl border border-white/10 bg-slate-900/60 p-4'>
              <p className='text-xs text-slate-400'>Members</p>
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
              <p className='text-xs text-slate-400'>Open Tasks</p>
              <p className='mt-1 text-2xl font-semibold text-white'>
                {tasks.filter((task) => task.status !== "done").length}
              </p>
            </div>
          </div>
        </section>

        <section className='mb-6 rounded-3xl border border-white/10 bg-slate-900/70 p-4 sm:p-5'>
          <div className='mb-4 flex items-center gap-2'>
            <Plus className='h-4 w-4 text-emerald-300' />
            <h2 className='text-base font-semibold text-white'>
              Assign Responsibility
            </h2>
          </div>
          <form
            onSubmit={onAssignTask}
            className='grid grid-cols-1 gap-3 md:grid-cols-2'
          >
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='Task title (e.g. Book flights)'
              className='h-11 rounded-xl border border-white/10 bg-slate-800 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500'
              required
            />
            <select
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              className='h-11 rounded-xl border border-white/10 bg-slate-800 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-slate-500'
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
              className='h-11 rounded-xl border border-white/10 bg-slate-800 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-slate-500'
            />
            <button
              type='submit'
              disabled={createTask.isPending}
              className='h-11 rounded-xl bg-emerald-500 text-slate-950 text-sm font-semibold transition hover:bg-emerald-400 disabled:opacity-60'
            >
              {createTask.isPending ? "Assigning..." : "Assign Task"}
            </button>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='Optional notes'
              className='md:col-span-2 min-h-[80px] rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 resize-none'
            />
          </form>
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
                const userId = group.memberIds?.[email];
                const memberTasks = userId ? memberTasksByUserId[userId] || [] : [];

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

                        <div className='mt-2 flex items-center gap-1.5 text-xs text-slate-500'>
                          <Calendar className='h-3.5 w-3.5' />
                          <span>
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
                      </div>
                    </div>

                    <div className='mt-4 space-y-2'>
                      <p className='text-[11px] uppercase tracking-wide text-slate-500'>
                        Responsibilities
                      </p>
                      {tasksLoading ? (
                        <p className='text-xs text-slate-500'>Loading tasks...</p>
                      ) : memberTasks.length === 0 ? (
                        <p className='text-xs text-slate-500'>No tasks assigned.</p>
                      ) : (
                        memberTasks.map((task) => (
                          <div
                            key={task.id}
                            className='rounded-xl border border-white/10 bg-slate-800/70 p-2.5'
                          >
                            <div className='flex items-start justify-between gap-2'>
                              <p className='text-xs font-medium text-slate-200'>
                                {task.title}
                              </p>
                              <button
                                onClick={() => deleteTask.mutate(task.id)}
                                disabled={deleteTask.isPending}
                                className='text-slate-500 hover:text-red-300 transition-colors'
                                aria-label='Delete task'
                                type='button'
                              >
                                <Trash2 className='h-3.5 w-3.5' />
                              </button>
                            </div>
                            <div className='mt-2 flex items-center gap-2'>
                              <select
                                value={task.status}
                                onChange={(e) =>
                                  updateTask.mutate({
                                    taskId: task.id,
                                    status: e.target.value as TaskStatus,
                                  })
                                }
                                className='h-7 rounded-md border border-white/10 bg-slate-900 px-2 text-[11px] text-slate-200'
                              >
                                <option value='not_started'>
                                  {STATUS_LABELS.not_started}
                                </option>
                                <option value='in_progress'>
                                  {STATUS_LABELS.in_progress}
                                </option>
                                <option value='done'>{STATUS_LABELS.done}</option>
                              </select>
                              {task.dueDate && (
                                <span className='text-[11px] text-slate-500'>
                                  Due{" "}
                                  {new Date(task.dueDate).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
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
      </div>
    </main>
  );
};

export default MembersComponent;
