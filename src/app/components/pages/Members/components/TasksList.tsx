import { Trash2 } from "lucide-react";
import type { MemberTask } from "@/src/shared/types";

type TaskStatus = "not_started" | "in_progress" | "done";

const STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  done: "Done",
};

interface TasksListProps {
  tasks: MemberTask[];
  isLoading: boolean;
  assigneeNameFor: (task: MemberTask) => string;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
  isDeleting: boolean;
}

export function TasksList({
  tasks,
  isLoading,
  assigneeNameFor,
  onStatusChange,
  onDelete,
  isDeleting,
}: TasksListProps) {
  return (
    <section className='border border-slate-800 rounded-2xl bg-slate-900 p-3 sm:p-4'>
      <h2 className='px-1 pb-3 text-sm font-semibold text-white'>All Tasks</h2>

      {isLoading ? (
        <div className='p-6 text-sm text-slate-400'>Loading</div>
      ) : tasks.length === 0 ? (
        <div className='rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400'>
          No tasks yet. Assign one above.
        </div>
      ) : (
        <div className='space-y-2'>
          {tasks.map((task) => (
            <div
              key={task.id}
              className='rounded-xl border border-slate-800 bg-slate-950 px-3 py-3'
            >
              <div className='flex flex-wrap items-start justify-between gap-2'>
                <div className='min-w-0'>
                  <p className='truncate text-sm font-medium text-white'>{task.title}</p>
                  <p className='mt-0.5 text-xs text-slate-400'>
                    Assigned to {assigneeNameFor(task)}
                  </p>
                  {task.notes && (
                    <p className='mt-1 text-xs text-slate-500 line-clamp-2'>{task.notes}</p>
                  )}
                </div>

                <button
                  onClick={() => onDelete(task.id)}
                  disabled={isDeleting}
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
                  onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                  className='h-8 rounded-lg border border-slate-700 bg-slate-900 px-2 text-xs text-slate-200'
                >
                  <option value='not_started'>{STATUS_LABELS.not_started}</option>
                  <option value='in_progress'>{STATUS_LABELS.in_progress}</option>
                  <option value='done'>{STATUS_LABELS.done}</option>
                </select>

                {task.dueDate && (
                  <span className='text-xs text-slate-500'>
                    Due{" "}
                    {new Date(task.dueDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
