"use client";

import React from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUnreadCount } from "@/src/hooks/useNotifications";
import { useRouter } from "next/navigation";

const NotificationBell = () => {
  const router = useRouter();

  return (
    <Button
      variant='ghost'
      size='icon'
      onClick={() => router.push("/notifications")}
      className='relative text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-200 hover:scale-105 active:scale-95'
      aria-label='Notifications'
    >
      <Bell className='h-5 w-5' />
      <UnreadBadge />
    </Button>
  );
};

const UnreadBadge = () => {
  const { data } = useUnreadCount();
  const count = data?.count || 0;

  if (count === 0) return null;

  return (
    <span
      className='absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold shadow-lg shadow-orange-500/30'
      style={{
        animation:
          count > 0 ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" : "none",
      }}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
};

export default NotificationBell;
