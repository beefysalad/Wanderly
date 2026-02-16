"use client";

import { Button } from "@/components/ui/button";
import { formatTime12Hour } from "@/lib/utils";
import { Activity } from "@/src/shared/types";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Layout,
  MapPin
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ITravelDayOverviewProps {
  startDate: Date;
  endDate: Date;
  activities: Activity[];
  onAddActivity?: (activity: Omit<Activity, "id">) => void;
  onUpdateActivity?: (id: string, updates: Partial<Activity>) => void;
  onDeleteActivity?: (id: string) => void;
  onToggleDone?: (id: string) => void;
  onEditActivity?: (activity: Activity) => void;
  onViewActivity?: (activity: Activity) => void;
}

const TravelDayOverview = ({
  startDate,
  endDate,
  activities,
  onViewActivity,
}: ITravelDayOverviewProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(startDate));
  const [direction, setDirection] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const getDaysInRange = () => {
    const days = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const allDays = getDaysInRange();
  
  const selectedDateKey = selectedDate.toISOString().split("T")[0];
  const dayActivities = activities
    .filter((a) => {
      const actDate = new Date(a.date);
      return (
        actDate.getFullYear() === selectedDate.getFullYear() &&
        actDate.getMonth() === selectedDate.getMonth() &&
        actDate.getDate() === selectedDate.getDate()
      );
    })
    .sort((a, b) => {
      if (!a.startTime && !b.startTime) return 0;
      if (!a.startTime) return 1;
      if (!b.startTime) return -1;
      return a.startTime.localeCompare(b.startTime);
    });

  const handleDateSelect = (date: Date) => {
    const newIdx = allDays.findIndex(d => d.toDateString() === date.toDateString());
    const oldIdx = allDays.findIndex(d => d.toDateString() === selectedDate.toDateString());
    setDirection(newIdx > oldIdx ? 1 : -1);
    setSelectedDate(date);
  };

  const nextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    if (next <= endDate) {
      setDirection(1);
      setSelectedDate(next);
    }
  };

  const prevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    if (prev >= startDate) {
      setDirection(-1);
      setSelectedDate(prev);
    }
  };

  // Center selected date in scroll view
  useEffect(() => {
    if (scrollRef.current) {
        const selectedEl = scrollRef.current.querySelector('[data-selected="true"]');
        if (selectedEl) {
            selectedEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    }
  }, [selectedDate]);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 500 : -500,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 500 : -500,
      opacity: 0
    })
  };

  const getTransportationIcon = (mode?: string) => {
    const icons: Record<string, string> = {
      car: "🚗",
      bus: "🚌",
      plane: "✈️",
      train: "🚊",
      taxi: "🚕",
      walking: "🚶",
      commute: "🚌",
    };
    return icons[mode || ""] || "🚗";
  };

  return (
    <div className="flex flex-col h-full space-y-8">
      {/* Horizontal Date Picker */}
      <div className="relative">
        <div 
          ref={scrollRef}
          className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar scroll-smooth"
        >
          {allDays.map((date, idx) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const hasActivities = activities.some(a => new Date(a.date).toDateString() === date.toDateString());
            
            return (
              <button
                key={idx}
                data-selected={isSelected}
                onClick={() => handleDateSelect(date)}
                className={`flex-none flex flex-col items-center justify-center w-16 h-20 rounded-2xl transition-all duration-300 border ${
                  isSelected 
                    ? "bg-gradient-to-br from-orange-500 to-amber-500 border-orange-500 text-white shadow-lg shadow-orange-500/20 translate-y-[-4px]" 
                    : "bg-slate-900/40 border-white/5 text-slate-400 hover:bg-slate-800 hover:border-white/10"
                }`}
              >
                <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isSelected ? "text-orange-100" : "text-slate-500"}`}>
                  {date.toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                <span className="text-xl font-black">
                  {date.getDate()}
                </span>
                {hasActivities && !isSelected && (
                  <div className="w-1 h-1 rounded-full bg-orange-500 mt-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Carousel */}
      <div className="flex-1 flex flex-col min-h-[400px]">
        <div className="flex items-center justify-between mb-6">
            <div>
                <h3 className="text-2xl font-black text-white">
                    {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </h3>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">
                    {dayActivities.length} {dayActivities.length === 1 ? "Activity" : "Activities"} planned
                </p>
            </div>
            <div className="flex gap-2">
                <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={prevDay}
                    disabled={selectedDate <= startDate}
                    className="rounded-full bg-slate-900 border-white/5 hover:bg-slate-800 hover:border-white/10"
                >
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={nextDay}
                    disabled={selectedDate >= endDate}
                    className="rounded-full bg-slate-900 border-white/5 hover:bg-slate-800 hover:border-white/10"
                >
                    <ChevronRight className="w-5 h-5" />
                </Button>
            </div>
        </div>

        <div className="relative flex-1 overflow-y-auto">
            <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                    key={selectedDateKey}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 }
                    }}
                    className="w-full"
                >
                    {dayActivities.length > 0 ? (
                        <div className="space-y-4 pb-8">
                            {dayActivities.map((activity, idx) => (
                                <motion.div
                                    key={activity.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => onViewActivity?.(activity)}
                                    className="group relative bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 border border-white/5 hover:border-orange-500/30 transition-all cursor-pointer overflow-hidden"
                                >
                                    {/* Decorative background element */}
                                    <div className="absolute -right-4 -top-4 text-white/[0.02] transform rotate-12 group-hover:rotate-0 transition-transform duration-700 pointer-events-none">
                                        <Layout className="w-32 h-32" />
                                    </div>

                                    <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
                                        {/* Time and Icon Section */}
                                        <div className="flex items-center gap-4 flex-none">
                                            <div className="flex flex-col items-center">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-2xl border border-white/5 shadow-inner">
                                                    {getTransportationIcon(activity.transportationMode)}
                                                </div>
                                                {activity.startTime && (
                                                    <div className="mt-3 px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-[10px] font-black text-orange-400 uppercase tracking-tighter">
                                                        {formatTime12Hour(activity.startTime)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="h-12 w-[1px] bg-white/5 hidden md:block" />
                                        </div>

                                        {/* Activity Details */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className={`text-lg md:text-xl font-bold mb-2 ${activity.done ? "text-slate-500 line-through" : "text-white"}`}>
                                                {activity.title}
                                            </h4>
                                            
                                            <div className="flex flex-wrap gap-4">
                                                {(activity.pickupLocation || activity.dropoffLocation) && (
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                                                        <MapPin className="w-3.5 h-3.5 text-orange-500/50" />
                                                        <span className="truncate max-w-[200px]">
                                                            {activity.pickupLocation || activity.dropoffLocation}
                                                        </span>
                                                    </div>
                                                )}
                                                {activity.notes && (
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                                                        <FileText className="w-3.5 h-3.5 text-blue-500/50" />
                                                        <span className="truncate max-w-[200px]">
                                                            {activity.notes}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Done Badge */}
                                        {activity.done && (
                                            <div className="flex-none flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Completed</span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center py-20 px-6 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                            <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center mb-6 shadow-xl border border-white/5">
                                <Layout className="w-10 h-10 text-slate-700" />
                            </div>
                            <h4 className="text-xl font-bold text-slate-300 mb-2">No activities planned</h4>
                            <p className="text-slate-500 max-w-xs text-sm">
                                Take a breather or add something exciting to your schedule for this day.
                            </p>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default TravelDayOverview;