"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadCount,
} from "@/src/hooks/useNotifications";
import type { Notification } from "@/src/shared/types";
import { AppShell } from "../../shared/AppShell/AppShell";
import { PageHeading } from "../../shared/AppShell/PageHeading";
import { notificationHref, notificationKind, timeAgo } from "../../shared/AppShell/notificationMeta";
import { KIND_STYLE } from "../../shared/AppShell/notificationStyle";
import { PILL } from "../../shared/Pills";

const PAGE_SIZE = 20;

type Filter = "all" | "unread";

const FILTER_PILL = "cursor-pointer rounded-full border px-4 py-[7px] text-[13px] font-semibold";

export default function NotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [limit, setLimit] = useState(PAGE_SIZE);

  const { data, isLoading, isFetching } = useNotifications({ limit, read: filter === "unread" ? false : undefined });
  const { data: unread } = useUnreadCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = data?.notifications ?? [];
  const unreadCount = unread?.count ?? 0;

  const open = (notification: Notification) => {
    if (!notification.read) markRead.mutate(notification.id);
    const href = notificationHref(notification);
    if (href) router.push(href);
  };

  return (
    <AppShell level='top'>
      <div className='flex max-w-[760px] flex-col gap-5'>
        <PageHeading
          eyebrow={`${unreadCount} unread`}
          title='Notifications'
          actions={
            unreadCount > 0 ? (
              <button type='button' onClick={() => markAllRead.mutate()} className={PILL.ghost}>
                Mark all as read
              </button>
            ) : null
          }
        />

        <div className='flex gap-2'>
          {(["all", "unread"] as const).map((value) => (
            <button
              key={value}
              type='button'
              onClick={() => {
                setFilter(value);
                setLimit(PAGE_SIZE);
              }}
              className={cn(
                FILTER_PILL,
                filter === value
                  ? "border-[rgba(251,191,36,.55)] bg-[rgba(251,191,36,.1)] text-[#f8fafc]"
                  : "border-white/[.1] text-[#cbd5e1]",
              )}
            >
              {value === "all" ? "All" : "Unread"}
            </button>
          ))}
        </div>

        <div className='overflow-hidden rounded-[22px] border border-white/[.08] bg-[rgba(15,23,42,.6)]'>
          {isLoading ? (
            <p className='flex items-center justify-center gap-2 p-10 text-sm text-[#64748b]'>
              <Loader2 className='size-4 animate-spin' /> Loading…
            </p>
          ) : notifications.length === 0 ? (
            <p className='p-10 text-center text-sm text-[#64748b]'>
              {filter === "unread" ? "Nothing unread." : "You're all caught up."}
            </p>
          ) : (
            notifications.map((notification, index) => {
              const { icon: Icon, tile } = KIND_STYLE[notificationKind(notification.type)];
              return (
                <button
                  key={notification.id}
                  type='button'
                  onClick={() => open(notification)}
                  className={cn(
                    "flex w-full cursor-pointer items-start gap-[14px] px-[18px] py-4 text-left hover:bg-white/[.03]",
                    index > 0 && "border-t border-white/[.06]",
                    !notification.read && "bg-[rgba(251,191,36,.035)]",
                  )}
                >
                  <span className={cn("flex size-9 flex-none items-center justify-center rounded-full", tile)}>
                    <Icon className='size-[18px]' />
                  </span>
                  <span className='flex min-w-0 flex-1 flex-col gap-[3px]'>
                    <span className={cn("text-sm text-[#f8fafc]", notification.read ? "font-medium" : "font-bold")}>
                      {notification.title}
                    </span>
                    <span className='text-[13px] leading-[1.5] text-[#94a3b8]'>{notification.message}</span>
                    <span className='font-mono text-[11px] text-[#64748b]'>{timeAgo(notification.createdAt)}</span>
                  </span>
                  {!notification.read ? <span className='mt-2 size-2 flex-none rounded-full bg-[#fbbf24]' /> : null}
                </button>
              );
            })
          )}
        </div>

        {data?.hasMore ? (
          <button
            type='button'
            onClick={() => setLimit((value) => value + PAGE_SIZE)}
            disabled={isFetching}
            className={cn(PILL.ghost, "self-center")}
          >
            {isFetching ? <Loader2 className='size-4 animate-spin' /> : null}
            Load more
          </button>
        ) : null}
      </div>
    </AppShell>
  );
}
