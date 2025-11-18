"use client";

import React from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import NotificationPanel from "./NotificationPanel";
import { useUnreadCount } from "@/src/hooks/useNotifications";

const NotificationBell = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-slate-700 hover:bg-slate-100 transition-all duration-200 hover:scale-105 active:scale-95"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <UnreadBadge />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="bg-gradient-to-br from-slate-50 via-white to-slate-50 border-l border-amber-500/20 p-0 w-full sm:w-96 max-w-[85vw] backdrop-blur-xl bg-white/95"
      >
        <NotificationPanel />
      </SheetContent>
    </Sheet>
  );
};

const UnreadBadge = () => {
  const { data } = useUnreadCount();
  const count = data?.count || 0;

  if (count === 0) return null;

  return (
    <span
      className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-lg animate-pulse"
      style={{
        animation: count > 0 ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" : "none",
      }}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
};

export default NotificationBell;

