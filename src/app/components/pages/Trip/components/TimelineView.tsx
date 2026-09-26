"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import type { Activity } from "@/src/shared/types";
import { PILL } from "../../../shared/Pills";
import { activitiesOn, activitySubline, activityTime, dayKey, tripDays } from "../tripView";
import { TickButton } from "./ActivityParts";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface RowProps {
  activity: Activity;
  readOnly: boolean;
  onToggleDone?: (id: string) => void;
  onViewActivity?: (activity: Activity) => void;
}

/** One activity on the timeline; the grip drags it to another day. */
function TimelineRow({ activity, readOnly, onToggleDone, onViewActivity }: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: activity.id });
  const time = activityTime(activity);
  const sub = activitySubline(activity);

  return (
    <div
      ref={setNodeRef}
      // dnd-kit positions the row while it is dragged, so this one inline style is unavoidable.
      style={{ transform: CSS.Transform.toString(transform), transition: isDragging ? "none" : transition }}
      className={cn("-mx-2 flex items-center gap-3 rounded-lg px-2 py-[6px] hover:bg-white/[.03]", isDragging && "z-10 opacity-30")}
    >
      {!readOnly ? (
        <button
          type='button'
          aria-label={`Drag "${activity.title}" to another day`}
          {...attributes}
          {...listeners}
          className='flex-none cursor-grab touch-none p-1 text-[#475569] hover:text-[#cbd5e1] active:cursor-grabbing'
        >
          <GripVertical className='size-4' />
        </button>
      ) : null}
      <span className='w-16 flex-none font-mono text-[11px] text-[#64748b]'>{time ?? "—"}</span>
      <button
        type='button'
        onClick={() => onViewActivity?.(activity)}
        className={cn("flex min-w-0 flex-1 flex-col gap-[2px] text-left", onViewActivity && "cursor-pointer")}
      >
        <span className={cn("text-sm font-semibold", activity.done ? "text-[#64748b] line-through" : "text-[#e2e8f0]")}>
          {activity.title}
        </span>
        {sub ? <span className='text-xs text-[#64748b]'>{sub}</span> : null}
      </button>
      <TickButton
        done={!!activity.done}
        label={activity.title}
        onToggle={onToggleDone && !readOnly ? () => onToggleDone(activity.id) : undefined}
      />
    </div>
  );
}

function DroppableDay({ id, activities, children }: { id: string; activities: Activity[]; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <SortableContext id={id} items={activities.map((activity) => activity.id)} strategy={verticalListSortingStrategy}>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[96px] min-w-0 flex-1 flex-col gap-2 border-l border-white/[.08] pb-[26px] pl-[18px]",
          isOver && "bg-[rgba(251,191,36,.05)]",
        )}
      >
        {children}
      </div>
    </SortableContext>
  );
}

interface TimelineViewProps {
  startDate: Date;
  endDate: Date;
  activities: Activity[];
  readOnly?: boolean;
  onViewActivity?: (activity: Activity) => void;
  onToggleDone?: (id: string) => void;
  onUpdateActivity?: (id: string, updates: Partial<Activity>) => void;
  addHref?: (date: Date) => string;
}

/** Every day down the page: the day on the left, a vertical rule, and its activities on the right. */
export function TimelineView({
  startDate,
  endDate,
  activities,
  readOnly = false,
  onViewActivity,
  onToggleDone,
  onUpdateActivity,
  addHref,
}: TimelineViewProps) {
  const [dragging, setDragging] = useState<Activity | null>(null);
  const days = tripDays(startDate, endDate);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    setDragging(null);
    const { active, over } = event;
    if (!over || !onUpdateActivity) return;

    const moved = activities.find((activity) => activity.id === active.id.toString());
    if (!moved) return;
    const overId = over.id.toString();

    // Dropped on a day: move it there.
    if (/^\d{4}-\d{2}-\d{2}$/.test(overId)) {
      if (moved.date !== overId) onUpdateActivity(moved.id, { date: overId });
      return;
    }

    // Dropped on another activity: join its day.
    const target = activities.find((activity) => activity.id === overId);
    if (target && target.id !== moved.id && moved.date !== target.date) {
      onUpdateActivity(moved.id, { date: target.date });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={(event: DragStartEvent) => setDragging(activities.find((a) => a.id === event.active.id) ?? null)}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDragging(null)}
    >
      <div className='flex flex-col'>
        {!readOnly && onUpdateActivity ? (
          <p className='mb-4 font-mono text-[10px] uppercase tracking-[.14em] text-[#475569]'>Drag an activity to another day to reschedule it</p>
        ) : null}
        {days.map((date, index) => {
          const dayActivities = activitiesOn(activities, date);
          return (
            <div key={dayKey(date)} className='flex gap-4'>
              <div className='flex w-[clamp(64px,12cqw,110px)] flex-none flex-col gap-[3px] pt-1'>
                <span className='font-mono text-[10px] uppercase tracking-[.14em] text-[#fbbf24]'>Day {index + 1}</span>
                <span className='text-[13px] font-semibold text-[#cbd5e1]'>
                  {WEEKDAYS[date.getDay()]}, {MONTHS[date.getMonth()]} {date.getDate()}
                </span>
                {!readOnly && addHref ? (
                  <Link href={addHref(date)} className={cn(PILL.amber, "mt-1 w-fit px-[10px] py-[5px] text-[11px]")}>
                    <Plus className='size-3' strokeWidth={2.4} />
                    Add
                  </Link>
                ) : null}
              </div>
              <DroppableDay id={dayKey(date)} activities={dayActivities}>
                {dayActivities.map((activity) => (
                  <TimelineRow
                    key={activity.id}
                    activity={activity}
                    readOnly={readOnly}
                    onToggleDone={onToggleDone}
                    onViewActivity={onViewActivity}
                  />
                ))}
                {dayActivities.length === 0 ? <span className='text-[13px] text-[#475569]'>Free day</span> : null}
              </DroppableDay>
            </div>
          );
        })}
      </div>

      {typeof document !== "undefined"
        ? createPortal(
            <DragOverlay modifiers={[restrictToWindowEdges]} dropAnimation={null}>
              {dragging ? (
                <div className='pointer-events-none flex w-[300px] cursor-grabbing items-center gap-2 rounded-xl border border-[rgba(251,191,36,.55)] bg-[#0f172a] p-3 shadow-2xl'>
                  <GripVertical className='size-4 text-[#fbbf24]' />
                  <span className='truncate text-sm font-semibold text-[#f8fafc]'>{dragging.title}</span>
                </div>
              ) : null}
            </DragOverlay>,
            document.body,
          )
        : null}
    </DndContext>
  );
}
