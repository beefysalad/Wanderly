"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BellOff,
  Calendar,
  CheckCheck,
  DollarSign,
  Edit,
  Loader2,
  MapPin,
  Receipt,
  Trash2,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/src/hooks/useNotifications";
import { useSocketNotifications } from "@/src/hooks/useSocketNotifications";
import type { Notification } from "@/src/shared/types";

const NotificationPanel = () => {
  useSocketNotifications();

  const { data, isLoading } = useNotifications({ limit: 50 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const router = useRouter();

  const [markingReadId, setMarkingReadId] = useState<string | null>(null);

  const notifications = useMemo(
    () => data?.notifications || [],
    [data?.notifications],
  );
  const unreadCount = notifications.filter((n) => !n.read).length;
  const hasUnread = unreadCount > 0;

  const groupedNotifications = useMemo(() => {
    const groups: Record<string, Notification[]> = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    notifications.forEach((notification) => {
      const date = new Date(notification.createdAt);
      let key: string;

      if (date >= today) {
        key = "Today";
      } else if (date >= yesterday) {
        key = "Yesterday";
      } else {
        key = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
        });
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(notification);
    });

    return groups;
  }, [notifications]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      setMarkingReadId(notification.id);
      try {
        await markRead.mutateAsync(notification.id);
      } finally {
        setMarkingReadId(null);
      }
    }

    if (notification.relatedTripId && notification.relatedGroupId) {
      router.push(
        `/group/${notification.relatedGroupId}/trip/${notification.relatedTripId}`,
      );
      return;
    }

    if (notification.relatedGroupId) {
      router.push(`/group/${notification.relatedGroupId}`);
    }
  };

  const handleMarkAllRead = async () => {
    if (!hasUnread) return;
    await markAllRead.mutateAsync();
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (isLoading) {
    return (
      <div className='flex h-full items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 p-8'>
        <div className='text-center'>
          <Loader2 className='mx-auto mb-3 h-8 w-8 animate-spin text-slate-400' />
          <p className='text-sm text-slate-400'>Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className='flex h-full flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center'>
        <div className='mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-slate-700 bg-slate-950'>
          <BellOff className='h-6 w-6 text-slate-500' />
        </div>
        <p className='mb-1 text-base font-semibold text-white'>No notifications yet</p>
        <p className='text-sm text-slate-400'>We&apos;ll show updates from your groups here.</p>
      </div>
    );
  }

  return (
    <div className='flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900'>
      <div className='flex items-center justify-between border-b border-slate-800 px-4 py-3'>
        <div className='flex items-center gap-2'>
          <h2 className='text-sm font-semibold text-white'>Notifications</h2>
          <span className='rounded-md border border-slate-700 px-1.5 py-0.5 text-[11px] text-slate-400'>
            {notifications.length}
          </span>
          {hasUnread && (
            <span className='rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[11px] text-amber-300'>
              {unreadCount} unread
            </span>
          )}
        </div>

        <Button
          variant='ghost'
          size='sm'
          onClick={handleMarkAllRead}
          disabled={!hasUnread || markAllRead.isPending}
          className='h-8 rounded-lg px-3 text-xs text-amber-300 hover:bg-amber-500/10 hover:text-amber-200 disabled:text-slate-500'
        >
          {markAllRead.isPending ? (
            <Loader2 className='mr-1.5 h-3.5 w-3.5 animate-spin' />
          ) : (
            <CheckCheck className='mr-1.5 h-3.5 w-3.5' />
          )}
          Mark all read
        </Button>
      </div>

      <div className='flex-1 overflow-y-auto px-3 py-4 sm:px-4 sm:py-5'>
        <div className='space-y-6'>
          {Object.entries(groupedNotifications).map(([dateGroup, groupItems]) => (
            <section key={dateGroup} className='space-y-2'>
              <p className='text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500'>
                {dateGroup}
              </p>

              <div className='space-y-2'>
                {groupItems.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    timeAgo={formatTimeAgo(notification.createdAt)}
                    icon={iconForType(notification.type)}
                    isMarkingRead={markingReadId === notification.id}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
  icon: React.ReactNode;
  timeAgo: string;
  isMarkingRead: boolean;
}

const NotificationItem = ({
  notification,
  onClick,
  icon,
  timeAgo,
  isMarkingRead,
}: NotificationItemProps) => {
  return (
    <button
      onClick={onClick}
      disabled={isMarkingRead}
      className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
        notification.read
          ? "border-slate-800 bg-slate-950 hover:bg-slate-900"
          : "border-amber-500/30 bg-slate-950 hover:bg-slate-900"
      } ${isMarkingRead ? "opacity-60 cursor-wait" : "cursor-pointer"}`}
    >
      <div className='flex items-start gap-3'>
        <div
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
            notification.read
              ? "border-slate-700 text-slate-400"
              : "border-amber-500/30 bg-amber-500/10 text-amber-300"
          }`}
        >
          {icon}
        </div>

        <div className='min-w-0 flex-1'>
          <div className='flex items-start justify-between gap-2'>
            <p className={`truncate text-sm font-medium ${notification.read ? "text-slate-300" : "text-white"}`}>
              {notification.title}
            </p>
            <span className='shrink-0 text-[11px] text-slate-500'>{timeAgo}</span>
          </div>

          <p className={`mt-0.5 line-clamp-2 text-xs ${notification.read ? "text-slate-500" : "text-slate-400"}`}>
            {notification.message}
          </p>
        </div>

        {!notification.read && <div className='mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-400' />}
      </div>
    </button>
  );
};

const iconForType = (type: Notification["type"]) => {
  switch (type) {
    case "payment":
      return <DollarSign className='h-4 w-4' />;
    case "group_join":
      return <UserPlus className='h-4 w-4' />;
    case "group_leave":
      return <UserMinus className='h-4 w-4' />;
    case "activity_added":
      return <Calendar className='h-4 w-4' />;
    case "activity_edited":
      return <Edit className='h-4 w-4' />;
    case "activity_deleted":
      return <Trash2 className='h-4 w-4' />;
    case "expense_added":
      return <Receipt className='h-4 w-4' />;
    case "expense_edited":
      return <Edit className='h-4 w-4' />;
    case "expense_deleted":
      return <Trash2 className='h-4 w-4' />;
    case "trip_created":
      return <MapPin className='h-4 w-4' />;
    case "trip_deleted":
      return <Trash2 className='h-4 w-4' />;
    default:
      return <BellOff className='h-4 w-4' />;
  }
};

export default NotificationPanel;
