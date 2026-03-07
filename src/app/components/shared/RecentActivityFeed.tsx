"use client";

import type { Notification } from "@/src/shared/types";
import {
  Calendar,
  DollarSign,
  Edit,
  MapPin,
  Receipt,
  Trash2,
  UserMinus,
  UserPlus,
} from "lucide-react";

interface RecentActivityFeedProps {
  title: string;
  notifications: Notification[];
  emptyText: string;
}

const iconForType = (type: Notification["type"]) => {
  switch (type) {
    case "payment":
    case "payment_confirmed":
    case "payment_rejected":
      return DollarSign;
    case "group_join":
      return UserPlus;
    case "group_leave":
      return UserMinus;
    case "activity_added":
      return Calendar;
    case "activity_edited":
    case "trip_updated":
    case "expense_edited":
      return Edit;
    case "activity_deleted":
    case "expense_deleted":
    case "trip_deleted":
      return Trash2;
    case "trip_created":
      return MapPin;
    case "expense_added":
      return Receipt;
    default:
      return Calendar;
  }
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

const RecentActivityFeed = ({
  title,
  notifications,
  emptyText,
}: RecentActivityFeedProps) => {
  return (
    <section className='rounded-2xl border border-white/10 bg-slate-900/60 p-4 sm:p-5'>
      <div className='mb-4 flex items-center justify-between'>
        <h3 className='text-sm font-semibold text-white'>{title}</h3>
        <span className='text-xs text-slate-500'>Live</span>
      </div>

      {notifications.length === 0 ? (
        <p className='text-sm text-slate-400'>{emptyText}</p>
      ) : (
        <div className='space-y-2.5'>
          {notifications.map((notification) => {
            const Icon = iconForType(notification.type);
            return (
              <article
                key={notification.id}
                className='rounded-xl border border-white/10 bg-slate-950/50 p-3'
              >
                <div className='mb-1 flex items-start gap-2.5'>
                  <div className='mt-0.5 rounded-lg bg-slate-800 p-1.5 text-slate-300'>
                    <Icon className='h-3.5 w-3.5' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-medium text-slate-200'>
                      {notification.title}
                    </p>
                    <p className='mt-0.5 line-clamp-2 text-xs text-slate-400'>
                      {notification.message}
                    </p>
                  </div>
                </div>
                <p className='text-[11px] text-slate-500'>
                  {formatTimeAgo(notification.createdAt)}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default RecentActivityFeed;
