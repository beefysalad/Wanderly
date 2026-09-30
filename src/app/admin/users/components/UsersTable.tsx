import { format } from "date-fns";
import { Activity, Trash2 } from "lucide-react";
import type { AdminUserSummary } from "@/src/shared/types";
import { getUserStatus, type UserStatus } from "../userListHelpers";

interface IUsersTableProps {
  users: AdminUserSummary[];
  deletingId: string | null;
  onDelete: (userId: string) => void;
}

const STATUS_STYLES: Record<UserStatus, { dot: string; text: string; pill: string; label: string; pulse?: boolean }> = {
  online: { dot: "bg-emerald-500", text: "text-emerald-500", pill: "bg-emerald-500/10 border-emerald-500/20", label: "Online", pulse: true },
  active: { dot: "bg-amber-500", text: "text-amber-500", pill: "bg-amber-500/10 border-amber-500/20", label: "Active" },
  offline: { dot: "bg-slate-500", text: "text-slate-500", pill: "bg-slate-500/10 border-slate-500/20", label: "Offline" },
};

/** The admin users table: identity, online status, trip/group counts, dates and a delete action. */
export const UsersTable = ({ users, deletingId, onDelete }: IUsersTableProps) => (
  <div className='bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden'>
    <div className='overflow-x-auto'>
      <table className='w-full text-left border-collapse'>
        <thead>
          <tr className='bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-slate-400 font-bold'>
            <th className='px-6 py-4'>User</th>
            <th className='px-6 py-4'>Status</th>
            <th className='px-6 py-4'>Stats</th>
            <th className='px-6 py-4'>Joined</th>
            <th className='px-6 py-4'>Last Active</th>
            <th className='px-6 py-4 text-right'>Actions</th>
          </tr>
        </thead>
        <tbody className='divide-y divide-white/5'>
          {users.map((user) => {
            const status = STATUS_STYLES[getUserStatus(user.lastLoginAt)];
            return (
              <tr key={user.id} className='hover:bg-white/[0.02] transition-colors group'>
                <td className='px-6 py-4'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 rounded-full bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center shrink-0'>
                      {user.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.imageUrl} alt={user.name} className='w-full h-full object-cover' />
                      ) : (
                        <span className='text-xs font-bold text-slate-500'>{user.name.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <div className='font-medium text-white'>{user.name}</div>
                      <div className='text-sm text-slate-500'>{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className='px-6 py-4'>
                  <div className='flex items-center gap-2'>
                    <div className={`flex items-center gap-2 px-2 py-1 rounded-full border ${status.pill}`}>
                      <div className={`w-2 h-2 rounded-full ${status.dot} ${status.pulse ? "animate-pulse" : ""}`} />
                      <span className={`text-xs font-bold uppercase tracking-wider ${status.text}`}>{status.label}</span>
                    </div>
                  </div>
                </td>
                <td className='px-6 py-4'>
                  <div className='flex gap-2 text-xs font-medium'>
                    <span className='px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20'>{user.stats.trips} Trips</span>
                    <span className='px-2 py-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20'>{user.stats.groups} Groups</span>
                  </div>
                </td>
                <td className='px-6 py-4 text-sm text-slate-400'>
                  <div className='flex flex-col'>
                    <span>{format(new Date(user.createdAt), "MMM d, yyyy")}</span>
                    <span className='text-xs text-slate-600'>ID: {user.id.slice(0, 8)}...</span>
                  </div>
                </td>
                <td className='px-6 py-4 text-sm text-slate-400'>
                  {user.lastLoginAt ? (
                    <div className='flex items-center gap-2 text-slate-300'>
                      <Activity className='w-3 h-3 text-slate-600' />
                      {format(new Date(user.lastLoginAt), "MMM d, HH:mm")}
                    </div>
                  ) : (
                    <span className='text-slate-600'>Never</span>
                  )}
                </td>
                <td className='px-6 py-4 text-right'>
                  <button
                    onClick={() => onDelete(user.id)}
                    disabled={deletingId === user.id}
                    className='p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                    title='Delete User'
                  >
                    {deletingId === user.id ? <div className='w-4 h-4 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin' /> : <Trash2 className='w-4 h-4' />}
                  </button>
                </td>
              </tr>
            );
          })}
          {users.length === 0 ? (
            <tr>
              <td colSpan={6} className='px-6 py-12 text-center text-slate-500'>
                No users found matching your search.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  </div>
);
