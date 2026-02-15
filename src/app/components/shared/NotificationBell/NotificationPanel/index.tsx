"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCheck,
  DollarSign,
  UserPlus,
  UserMinus,
  Calendar,
  Receipt,
  MapPin,
  Loader2,
  BellOff,
  Trash2,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/src/hooks/useNotifications";
import { useSocketNotifications } from "@/src/hooks/useSocketNotifications";
import type { Notification } from "@/src/shared/types";

const NotificationPanel = () => {
  // Enable real-time notifications via Socket.IO
  useSocketNotifications();

  const { data, isLoading } = useNotifications({ limit: 50 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const router = useRouter();
  const [markingReadId, setMarkingReadId] = React.useState<string | null>(null);

  const notifications = data?.notifications || [];
  const hasUnread = notifications.some((n) => !n.read);

  const groupedNotifications = useMemo(() => {
    const notifications = data?.notifications || [];
    const groups: Record<string, Notification[]> = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    notifications.forEach((notification) => {
      const date = new Date(notification.createdAt);
      let groupKey: string;

      if (date >= today) {
        groupKey = "Today";
      } else if (date >= yesterday) {
        groupKey = "Yesterday";
      } else {
        groupKey = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year:
            date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
        });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notification);
    });

    return groups;
  }, [data?.notifications]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      setMarkingReadId(notification.id);
      try {
        await markRead.mutateAsync(notification.id);
      } finally {
        setMarkingReadId(null);
      }
    }

    // Navigate to related page
    if (notification.relatedTripId && notification.relatedGroupId) {
      router.push(
        `/group/${notification.relatedGroupId}/trip/${notification.relatedTripId}`,
      );
    } else if (notification.relatedGroupId) {
      router.push(`/group/${notification.relatedGroupId}`);
    }
  };

  const handleMarkAllRead = async () => {
    if (hasUnread) {
      await markAllRead.mutateAsync();
    }
  };

  const getNotificationStyles = (type: Notification["type"]) => {
    switch (type) {
      case "payment":
        return { icon: <DollarSign className='h-5 w-5' />, color: "emerald" };
      case "group_join":
        return { icon: <UserPlus className='h-5 w-5' />, color: "blue" };
      case "group_leave":
        return { icon: <UserMinus className='h-5 w-5' />, color: "red" };
      case "activity_added":
        return { icon: <Calendar className='h-5 w-5' />, color: "purple" };
      case "activity_edited":
        return { icon: <Edit className='h-5 w-5' />, color: "indigo" };
      case "activity_deleted":
        return { icon: <Trash2 className='h-5 w-5' />, color: "red" };
      case "expense_added":
        return { icon: <Receipt className='h-5 w-5' />, color: "orange" };
      case "expense_edited":
        return { icon: <Edit className='h-5 w-5' />, color: "amber" };
      case "expense_deleted":
        return { icon: <Trash2 className='h-5 w-5' />, color: "red" };
      case "trip_created":
        return { icon: <MapPin className='h-5 w-5' />, color: "amber" };
      case "trip_deleted":
        return { icon: <Trash2 className='h-5 w-5' />, color: "red" };
      default:
        return { icon: <BellOff className='h-5 w-5' />, color: "slate" };
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    }
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  };

  if (isLoading) {
    return (
      <div className='flex flex-col h-full bg-slate-950/50'>
        <div className='flex-1 flex items-center justify-center p-8'>
          <div className='text-center'>
            <Loader2 className='h-10 w-10 animate-spin text-orange-500 mx-auto mb-4' />
            <p className='text-slate-400 font-medium animate-pulse'>
              Syncing notifications...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className='flex flex-col h-full bg-slate-950/50'>
        <div className='flex-1 flex flex-col items-center justify-center p-8 text-center'>
          <div className='w-24 h-24 bg-slate-900/50 rounded-full flex items-center justify-center mb-6 border border-white/5 shadow-2xl'>
            <BellOff className='h-10 w-10 text-slate-600' />
          </div>
          <p className='text-white text-xl font-black mb-2'>Quiet for now</p>
          <p className='text-sm text-slate-500 max-w-[200px]'>
            When something happens in your groups, we&apos;ll let you know.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-full bg-slate-950/50'>
      {/* Action Bar */}
      <div className='p-4 flex items-center justify-between border-b border-white/5'>
        <h2 className='text-xs font-black uppercase text-slate-500 tracking-widest'>
          All Updates
        </h2>
        {hasUnread && (
          <Button
            variant='ghost'
            size='sm'
            onClick={handleMarkAllRead}
            disabled={markAllRead.isPending}
            className='h-8 text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-400 hover:bg-orange-500/5 rounded-lg px-3 transition-colors'
          >
            {markAllRead.isPending ? (
              <Loader2 className='h-3 w-3 animate-spin mr-2' />
            ) : (
              <CheckCheck className='h-3 w-3 mr-2' />
            )}
            Mark all read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className='flex-1 overflow-y-auto px-4 py-6 space-y-8 pb-32'>
        {Object.entries(groupedNotifications).map(
          ([dateGroup, groupNotifications]) => (
            <div key={dateGroup} className='space-y-4'>
              <div className='flex items-center gap-4'>
                <p className='text-[10px] font-black uppercase text-slate-600 tracking-widest whitespace-nowrap'>
                  {dateGroup}
                </p>
                <div className='h-px w-full bg-white/5' />
              </div>
              <div className='space-y-3'>
                {groupNotifications.map((notification) => {
                  const styles = getNotificationStyles(notification.type);
                  return (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                      icon={styles.icon}
                      themeColor={styles.color}
                      timeAgo={formatTimeAgo(notification.createdAt)}
                      isMarkingRead={markingReadId === notification.id}
                    />
                  );
                })}
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
};

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
  icon: React.ReactNode;
  themeColor: string;
  timeAgo: string;
  isMarkingRead: boolean;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClick,
  icon,
  themeColor,
  timeAgo,
  isMarkingRead,
}) => {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-500 text-emerald-500",
    blue: "bg-blue-500 text-blue-500",
    red: "bg-red-500 text-red-500",
    purple: "bg-purple-500 text-purple-500",
    indigo: "bg-indigo-500 text-indigo-500",
    orange: "bg-orange-500 text-orange-500",
    amber: "bg-amber-500 text-amber-500",
    slate: "bg-slate-500 text-slate-500",
  };

  const colorClass = colorMap[themeColor] || colorMap.slate;
  const [bgClass, textClass] = colorClass.split(" ");

  return (
    <button
      onClick={onClick}
      disabled={isMarkingRead}
      className={`
        w-full group relative flex flex-col p-4 rounded-2xl transition-all duration-300
        ${
          notification.read
            ? "bg-slate-900/20 border border-white/5 hover:bg-slate-900/40"
            : "bg-slate-900/60 border border-orange-500/20 shadow-xl shadow-orange-500/5 hover:bg-slate-900/80"
        }
        ${isMarkingRead ? "opacity-50 cursor-wait" : "cursor-pointer active:scale-[0.98]"}
      `}
    >
      <div className='flex items-start gap-4'>
        {/* Icon Container */}
        <div
          className={`
          relative flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all
          ${bgClass}/10 ${textClass} border border-white/5 group-hover:scale-110
        `}
        >
          <div
            className={`absolute inset-0 ${bgClass} opacity-10 blur-md rounded-full`}
          />
          <div className='relative z-10'>{icon}</div>
        </div>

        {/* Content */}
        <div className='flex-1 min-w-0'>
          <div className='flex items-start justify-between gap-4 mb-1'>
            <h3
              className={`text-sm font-bold leading-tight truncate ${notification.read ? "text-slate-400" : "text-white"}`}
            >
              {notification.title}
            </h3>
            <span className='text-[10px] font-black text-slate-500 whitespace-nowrap mt-0.5'>
              {timeAgo}
            </span>
          </div>
          <p
            className={`text-xs line-clamp-2 leading-relaxed ${notification.read ? "text-slate-500" : "text-slate-300"}`}
          >
            {notification.message}
          </p>
        </div>

        {/* Unread Indicator */}
        {!notification.read && (
          <div className='flex-shrink-0 self-center pl-2'>
            <div className='w-2 h-2 rounded-full bg-orange-500 shadow-lg shadow-orange-500/50 animate-pulse' />
          </div>
        )}
      </div>

      {/* Decorative Border for Unread */}
      {!notification.read && (
        <div className='absolute left-[-1px] top-4 bottom-4 w-[3px] bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]' />
      )}
    </button>
  );
};

export default NotificationPanel;
