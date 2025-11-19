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
import { SheetTitle } from "@/components/ui/sheet";
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

    // Navigate to related page
    if (notification.relatedTripId && notification.relatedGroupId) {
      router.push(
        `/group/${notification.relatedGroupId}/trip/${notification.relatedTripId}`
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

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "payment":
        return <DollarSign className='h-5 w-5 text-emerald-500' />;
      case "group_join":
        return <UserPlus className='h-5 w-5 text-blue-500' />;
      case "group_leave":
        return <UserMinus className='h-5 w-5 text-red-500' />;
      case "activity_added":
        return <Calendar className='h-5 w-5 text-purple-500' />;
      case "activity_edited":
        return <Edit className='h-5 w-5 text-indigo-500' />;
      case "activity_deleted":
        return <Trash2 className='h-5 w-5 text-red-500' />;
      case "expense_added":
        return <Receipt className='h-5 w-5 text-orange-500' />;
      case "expense_edited":
        return <Edit className='h-5 w-5 text-amber-600' />;
      case "expense_deleted":
        return <Trash2 className='h-5 w-5 text-red-500' />;
      case "trip_created":
        return <MapPin className='h-5 w-5 text-amber-500' />;
      case "trip_deleted":
        return <Trash2 className='h-5 w-5 text-red-500' />;
      default:
        return <BellOff className='h-5 w-5 text-slate-400' />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    }
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  };

  if (isLoading) {
    return (
      <div className='flex flex-col h-full'>
        <div className='p-4 border-b border-slate-200'>
          <SheetTitle className='text-xl font-bold text-slate-900'>
            Notifications
          </SheetTitle>
        </div>
        <div className='flex-1 flex items-center justify-center'>
          <Loader2 className='h-8 w-8 animate-spin text-amber-500' />
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className='flex flex-col h-full'>
        <div className='p-4 border-b border-slate-200'>
          <SheetTitle className='text-xl font-bold text-slate-900'>
            Notifications
          </SheetTitle>
        </div>
        <div className='flex-1 flex flex-col items-center justify-center p-8 text-center'>
          <BellOff className='h-16 w-16 text-slate-300 mb-4' />
          <p className='text-slate-600 font-medium mb-1'>No notifications</p>
          <p className='text-sm text-slate-500'>
            You&apos;re all caught up! New notifications will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-full'>
      {/* Header */}
      <div className='p-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm'>
        <div className='flex items-center justify-between mb-2'>
          <SheetTitle className='text-xl font-bold text-slate-900'>
            Notifications
          </SheetTitle>
          {hasUnread && (
            <Button
              variant='ghost'
              size='sm'
              onClick={handleMarkAllRead}
              disabled={markAllRead.isPending}
              className='text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50'
            >
              {markAllRead.isPending ? (
                <Loader2 className='h-3 w-3 animate-spin mr-1' />
              ) : (
                <CheckCheck className='h-3 w-3 mr-1' />
              )}
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className='flex-1 overflow-y-auto'>
        {Object.entries(groupedNotifications).map(
          ([dateGroup, groupNotifications]) => (
            <div key={dateGroup} className='mb-4'>
              <div className='px-4 py-2 bg-slate-50/50 border-b border-slate-100'>
                <p className='text-xs font-semibold text-slate-600 uppercase tracking-wide'>
                  {dateGroup}
                </p>
              </div>
              <div className='space-y-1'>
                {groupNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    icon={getNotificationIcon(notification.type)}
                    timeAgo={formatTimeAgo(notification.createdAt)}
                    isMarkingRead={markingReadId === notification.id}
                  />
                ))}
              </div>
            </div>
          )
        )}
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

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClick,
  icon,
  timeAgo,
  isMarkingRead,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={isMarkingRead}
      className={`
        w-full px-4 py-3 text-left transition-all duration-200
        hover:bg-slate-50 active:bg-slate-100
        border-l-4 ${
          notification.read
            ? "border-transparent bg-white/50 opacity-75"
            : "border-amber-500 bg-amber-50/30"
        }
        ${isMarkingRead ? "opacity-50 cursor-wait" : "cursor-pointer"}
      `}
    >
      <div className='flex items-start gap-3'>
        <div className='flex-shrink-0 mt-0.5'>{icon}</div>
        <div className='flex-1 min-w-0'>
          <div className='flex items-start justify-between gap-2 mb-1'>
            <h3
              className={`text-sm font-semibold ${
                notification.read ? "text-slate-700" : "text-slate-900"
              }`}
            >
              {notification.title}
            </h3>
            {!notification.read && (
              <span className='flex-shrink-0 w-2 h-2 rounded-full bg-amber-500 mt-1.5' />
            )}
          </div>
          <p
            className={`text-sm mb-1 ${
              notification.read ? "text-slate-500" : "text-slate-700"
            }`}
          >
            {notification.message}
          </p>
          <p className='text-xs text-slate-400'>{timeAgo}</p>
        </div>
      </div>
    </button>
  );
};

export default NotificationPanel;
