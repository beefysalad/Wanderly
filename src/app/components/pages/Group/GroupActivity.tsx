import { cn } from "@/lib/utils";
import type { Notification } from "@/src/shared/types";
import { NOTIFICATION_DOT, notificationKind, timeAgo } from "../../shared/AppShell/notificationMeta";

/** The latest updates in this group, as a short feed. */
export function GroupActivity({ notifications }: { notifications: Notification[] }) {
  return (
    <div className='flex min-w-0 flex-[1_1_280px] flex-col gap-[14px] rounded-[22px] border border-white/[.08] bg-[rgba(15,23,42,.6)] p-[18px]'>
      <span className='font-mono text-[10px] uppercase tracking-[.16em] text-[#64748b]'>Recent group activity</span>
      {notifications.map((notification) => (
        <div key={notification.id} className='flex gap-3'>
          <span
            className={cn(
              "mt-[5px] size-2 flex-none rounded-full",
              NOTIFICATION_DOT[notificationKind(notification.type)],
            )}
          />
          <span className='flex min-w-0 flex-col gap-[2px]'>
            <span className='text-[13px] font-semibold text-[#e2e8f0]'>{notification.title}</span>
            <span className='text-xs text-[#94a3b8]'>{notification.message}</span>
            <span className='font-mono text-[10px] text-[#475569]'>{timeAgo(notification.createdAt)}</span>
          </span>
        </div>
      ))}
      {notifications.length === 0 ? (
        <span className='text-[13px] text-[#64748b]'>No recent updates in this group yet.</span>
      ) : null}
    </div>
  );
}
