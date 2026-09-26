"use client";

import { Bell, Calendar, Check, MapPin, Receipt, UserPlus, Wallet, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadCount,
} from "@/src/hooks/useNotifications";
import type { Notification } from "@/src/shared/types";
import { notificationHref, notificationKind, timeAgo, type NotificationKind } from "./notificationMeta";

// Literal class strings so Tailwind can generate them.
const KIND_STYLE: Record<NotificationKind, { icon: LucideIcon; tile: string }> = {
  pay: { icon: Wallet, tile: "bg-[#fbbf24]/[.12] text-[#fbbf24]" },
  ok: { icon: Check, tile: "bg-[#34d399]/[.12] text-[#34d399]" },
  exp: { icon: Receipt, tile: "bg-[#fb923c]/[.12] text-[#fb923c]" },
  join: { icon: UserPlus, tile: "bg-[#38bdf8]/[.12] text-[#38bdf8]" },
  act: { icon: Calendar, tile: "bg-[#a78bfa]/[.12] text-[#a78bfa]" },
  trip: { icon: MapPin, tile: "bg-[#fbbf24]/[.12] text-[#fbbf24]" },
};

const PREVIEW_COUNT = 6;

interface NotificationsMenuProps {
  /** "left": hangs off the bell (sidebar). "right": spans the screen under the top bar (phones). */
  align: "left" | "right";
  /** Extra classes for the bell button (size and border differ between the sidebar and the phone top bar). */
  buttonClassName?: string;
}

/** A bell with an unread badge that opens a dropdown of your latest notifications. */
export function NotificationsMenu({ align, buttonClassName }: NotificationsMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const { data: unread } = useUnreadCount();
  const { data, isLoading } = useNotifications({ limit: PREVIEW_COUNT });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = unread?.count ?? 0;
  const notifications = data?.notifications ?? [];

  // Close on outside click, Escape, or when the page changes.
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (wrapper.current && !wrapper.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  const openNotification = (notification: Notification) => {
    if (!notification.read) markRead.mutate(notification.id);
    setOpen(false);
    const href = notificationHref(notification);
    if (href) router.push(href);
  };

  return (
    <div ref={wrapper} className='relative'>
      <button
        type='button'
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-expanded={open}
        aria-haspopup='true'
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "relative flex size-9 cursor-pointer items-center justify-center rounded-full border border-white/[.1] bg-white/[.03] text-[#e2e8f0] hover:bg-white/[.07]",
          open && "border-[rgba(251,191,36,.45)] text-[#fbbf24]",
          buttonClassName,
        )}
      >
        <Bell className='size-[17px]' />
        {unreadCount > 0 ? (
          <span className='absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[#020617] bg-[#fbbf24] px-1 text-[10px] font-extrabold text-[#160c02]'>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role='menu'
          className={cn(
            "z-50 overflow-hidden rounded-[18px] border border-white/[.1] bg-[#020617] shadow-[0_30px_80px_-30px_rgba(0,0,0,1)]",
            // Beside the sidebar logo it hangs off the bell; on phones it spans the screen under the top bar.
            align === "left"
              ? "absolute left-0 top-full mt-2 w-[360px]"
              : "fixed inset-x-3 top-[72px]",
          )}
        >
          <div className='flex items-center justify-between gap-3 border-b border-white/[.06] px-4 py-3'>
            <span className='font-mono text-[10px] uppercase tracking-[.16em] text-[#94a3b8]'>
              Notifications{unreadCount > 0 ? ` · ${unreadCount} unread` : ""}
            </span>
            {unreadCount > 0 ? (
              <button
                type='button'
                onClick={() => markAllRead.mutate()}
                className='cursor-pointer text-xs font-semibold text-[#fbbf24] hover:text-[#fcd34d]'
              >
                Mark all as read
              </button>
            ) : null}
          </div>

          <div className='max-h-[420px] overflow-y-auto [scrollbar-width:none]'>
            {isLoading ? <p className='px-4 py-6 text-center text-[13px] text-[#64748b]'>Loading…</p> : null}
            {!isLoading && notifications.length === 0 ? (
              <p className='px-4 py-8 text-center text-[13px] text-[#64748b]'>You&apos;re all caught up.</p>
            ) : null}
            {notifications.map((notification, index) => {
              const { icon: Icon, tile } = KIND_STYLE[notificationKind(notification.type)];
              return (
                <button
                  key={notification.id}
                  type='button'
                  role='menuitem'
                  onClick={() => openNotification(notification)}
                  className={cn(
                    "flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left hover:bg-white/[.04]",
                    index > 0 && "border-t border-white/[.05]",
                    !notification.read && "bg-[rgba(251,191,36,.035)]",
                  )}
                >
                  <span className={cn("flex size-8 flex-none items-center justify-center rounded-[10px]", tile)}>
                    <Icon className='size-4' />
                  </span>
                  <span className='flex min-w-0 flex-1 flex-col gap-[2px]'>
                    <span className={cn("truncate text-[13px] text-[#f8fafc]", notification.read ? "font-medium" : "font-bold")}>
                      {notification.title}
                    </span>
                    <span className='line-clamp-2 text-xs leading-[1.45] text-[#94a3b8]'>{notification.message}</span>
                    <span className='font-mono text-[10px] text-[#64748b]'>{timeAgo(notification.createdAt)}</span>
                  </span>
                  {!notification.read ? <span className='mt-[6px] size-2 flex-none rounded-full bg-[#fbbf24]' /> : null}
                </button>
              );
            })}
          </div>

          <Link
            href='/notifications'
            className='block border-t border-white/[.06] px-4 py-3 text-center text-[13px] font-semibold text-[#fbbf24] hover:bg-white/[.04]'
          >
            View all notifications
          </Link>
        </div>
      ) : null}
    </div>
  );
}
