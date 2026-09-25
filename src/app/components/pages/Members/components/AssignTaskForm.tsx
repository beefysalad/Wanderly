"use client";
import { Plus } from "lucide-react";

interface AssignTaskFormProps {
  title: string;
  onTitleChange: (value: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  dueDate: string;
  onDueDateChange: (value: string) => void;
  assignedToId: string;
  onAssignedToIdChange: (value: string) => void;
  members: { userId: string; email: string; displayName: string }[];
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function AssignTaskForm({
  title,
  onTitleChange,
  notes,
  onNotesChange,
  dueDate,
  onDueDateChange,
  assignedToId,
  onAssignedToIdChange,
  members,
  isSubmitting,
  onSubmit,
}: AssignTaskFormProps) {
  return (
    <section className='mb-6 border border-slate-800 rounded-2xl bg-slate-900 p-4 sm:p-5'>
      <div className='mb-3 flex items-center gap-2'>
        <Plus className='h-4 w-4 text-amber-400' />
        <h2 className='text-base font-semibold text-white'>Assign Task</h2>
      </div>

      <form onSubmit={onSubmit} className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder='Task title'
          className='h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500'
          required
        />

        <select
          value={assignedToId}
          onChange={(e) => onAssignedToIdChange(e.target.value)}
          className='h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-slate-500'
          required
        >
          <option value=''>Assign to member</option>
          {members.map((member) => (
            <option key={member.email} value={member.userId}>
              {member.displayName}
            </option>
          ))}
        </select>

        <input
          type='date'
          value={dueDate}
          onChange={(e) => onDueDateChange(e.target.value)}
          className='h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-slate-500'
        />

        <button
          type='submit'
          disabled={isSubmitting}
          className='h-11 rounded-xl bg-amber-500 text-slate-950 text-sm font-semibold transition hover:bg-amber-400 disabled:opacity-60'
        >
          {isSubmitting ? "Assigning..." : "Assign Task"}
        </button>

        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder='Optional notes'
          className='sm:col-span-2 min-h-[84px] rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 resize-none'
        />
      </form>
    </section>
  );
}
