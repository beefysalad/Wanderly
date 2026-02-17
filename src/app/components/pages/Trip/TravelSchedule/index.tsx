import { Button } from "@/components/ui/button";
import { formatTime12Hour } from "@/lib/utils";
import { Activity } from "@/src/shared/types";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  rectIntersection,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  GripVertical,
  MapPin
} from "lucide-react";
import React, { useState } from "react";
import { createPortal } from "react-dom";

interface ITravelScheduleProps {
  startDate: Date;
  endDate: Date;
  activities: Activity[];
  onAddActivity?: (activity: Omit<Activity, "id">) => void;
  onUpdateActivity?: (id: string, updates: Partial<Activity>) => void;
  onDeleteActivity?: (id: string) => void;
  onToggleDone?: (id: string) => void;
  onEditActivity?: (activity: Activity) => void;
  onViewActivity?: (activity: Activity) => void;
  tripName?: string;
  readOnly?: boolean;
}

// Draggable Activity Card Component
const DraggableActivity = ({
  activity,
  onToggleDone,
  onEditActivity,
  onDeleteActivity,
  onViewActivity,
  readOnly,
  isExpanded,
  onToggleExpand,
}: {
  activity: Activity;
  onToggleDone?: (id: string) => void;
  onEditActivity?: (activity: Activity) => void;
  onDeleteActivity?: (id: string) => void;
  onViewActivity?: (activity: Activity) => void;
  readOnly: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? "none" : transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 10 : 1,
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

  const hasLocation = activity.pickupLocation || activity.dropoffLocation;
  const showExpandButton = hasLocation || activity.transportationMode;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='bg-slate-800/30 rounded-lg md:rounded-xl border border-white/5 overflow-hidden hover:border-orange-500/30 transition-all'
    >
      {/* Main Activity Row */}
      <div className='flex items-start gap-3 p-4 md:p-5'>
        {/* Drag Handle */}
        {!readOnly && (
          <button
            {...attributes}
            {...listeners}
            className='flex-none p-2 text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing touch-none'
          >
            <GripVertical className='w-4 h-4' />
          </button>
        )}

        {/* Time Badge (Mobile) / Checkbox (Desktop) */}
        <div className='flex-none'>
          {/* Mobile: Show time as badge */}
          <div className='md:hidden'>
            {activity.startTime || activity.pickupTime ? (
              <div className='flex items-center gap-1 px-2 py-1 bg-slate-900/50 rounded text-xs text-slate-300'>
                <Clock className='w-3 h-3' />
                {activity.startTime
                  ? formatTime12Hour(activity.startTime)
                  : formatTime12Hour(activity.pickupTime!)}
              </div>
            ) : (
              <div className='w-8 h-8' />
            )}
          </div>

          {/* Desktop: Show checkbox */}
          {!readOnly && onToggleDone && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleDone(activity.id);
              }}
              className={`hidden md:flex w-6 h-6 rounded-full border-2 items-center justify-center transition-all ${
                activity.done
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-500"
                  : "border-slate-600 hover:border-orange-500"
              }`}
            >
              {activity.done && <span className='text-xs font-bold'>✓</span>}
            </button>
          )}
        </div>

        {/* Content */}
        <div
          className='flex-1 min-w-0 cursor-pointer'
          onClick={() => {
            if (onViewActivity) {
              onViewActivity(activity);
            } else if (showExpandButton) {
              onToggleExpand();
            }
          }}
        >
          <div className='flex items-start justify-between gap-2'>
            <h3
              className={`text-sm md:text-base font-medium leading-snug ${
                activity.done ? "text-slate-500 line-through" : "text-white"
              }`}
            >
              {activity.title}
            </h3>


          </div>

          {/* Time on Desktop */}
          <div className='hidden md:flex items-center gap-3 mt-1'>
            {(activity.startTime || activity.pickupTime) && (
              <span className='flex items-center gap-1 text-xs text-slate-400'>
                <Clock className='w-3 h-3' />
                {activity.startTime
                  ? formatTime12Hour(activity.startTime)
                  : formatTime12Hour(activity.pickupTime!)}
              </span>
            )}
            {activity.transportationMode && (
              <span className='text-sm'>
                {getTransportationIcon(activity.transportationMode)}
              </span>
            )}
          </div>
        </div>

        {/* Expand Indicator */}
        {showExpandButton && (
          <button
            onClick={onToggleExpand}
            className='flex-none text-slate-500 p-1'
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className='px-3 pb-3 md:px-4 md:pb-4 space-y-2 border-t border-white/5 pt-3'>
          {activity.transportationMode && (
            <div className='flex items-center gap-2 text-xs md:text-sm text-slate-400'>
              <span className='text-base'>
                {getTransportationIcon(activity.transportationMode)}
              </span>
              <span className='capitalize'>{activity.transportationMode}</span>
            </div>
          )}
          {(activity.pickupLocation || activity.dropoffLocation) && (
            <div className='flex items-start gap-2 text-xs md:text-sm text-slate-400'>
              <MapPin className='w-3.5 h-3.5 md:w-4 md:h-4 flex-none mt-0.5' />
              <span className='break-words'>
                {activity.pickupLocation || activity.dropoffLocation}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Drag Overlay Component (what you see while dragging)
const ActivityDragOverlay = ({ activity }: { activity: Activity | null }) => {
  if (!activity) return null;

  return (
    <div className='bg-slate-800 rounded-lg border-2 border-orange-500 p-3 shadow-2xl opacity-90 cursor-grabbing w-[300px] pointer-events-none'>
      <div className='flex items-center gap-2 mb-1'>
        <GripVertical className='w-4 h-4 text-orange-500' />
        <h3 className='text-sm font-medium text-white truncate'>
          {activity.title}
        </h3>
      </div>
      {(activity.startTime || activity.pickupTime) && (
        <span className='text-xs text-slate-400 ml-6'>
          {activity.startTime
            ? formatTime12Hour(activity.startTime)
            : formatTime12Hour(activity.pickupTime!)}
        </span>
      )}
    </div>
  );
};

// Droppable Day Container Component
const DroppableDay = ({
  id,
  children,
  dayActivities,
  readOnly,
}: {
  id: string;
  children: React.ReactNode;
  dayActivities: Activity[];
  readOnly: boolean;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <SortableContext
      id={id}
      items={dayActivities.map((a) => a.id)}
      strategy={verticalListSortingStrategy}
    >
      <div
        ref={setNodeRef}
        className={`px-3 py-3 md:px-4 md:py-4 space-y-2 min-h-[100px] transition-colors rounded-b-xl ${
          isOver ? "bg-orange-500/10" : ""
        } ${dayActivities.length === 0 ? "flex items-center justify-center" : ""}`}
      >
        {dayActivities.length === 0 ? (
          <div className='text-center py-4 text-slate-500 text-sm'>
            {readOnly
              ? "No activities planned"
              : "Drop activities here or add new ones"}
          </div>
        ) : (
          children
        )}
      </div>
    </SortableContext>
  );
};

const TravelSchedule = ({
  activities,
  endDate,
  onDeleteActivity,
  onToggleDone,
  onEditActivity,
  onViewActivity,
  onUpdateActivity,
  startDate,
  readOnly = false,
}: ITravelScheduleProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(
    new Set(),
  );
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());
  const [activeActivity, setActiveActivity] = useState<Activity | null>(null);

  const daysPerPage = 7;

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms hold to start drag on mobile
        tolerance: 5,
      },
    }),
  );

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
  const totalPages = Math.ceil(allDays.length / daysPerPage);
  const startIndex = (currentPage - 1) * daysPerPage;
  const endIndex = startIndex + daysPerPage;
  const days = allDays.slice(startIndex, endIndex);

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const toggleActivityExpansion = (id: string) => {
    setExpandedActivities((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleDayCollapse = (dateKey: string) => {
    setCollapsedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dateKey)) {
        newSet.delete(dateKey);
      } else {
        newSet.add(dateKey);
      }
      return newSet;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const activity = activities.find((a) => a.id === event.active.id);
    setActiveActivity(activity || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveActivity(null);

    const { active, over } = event;

    if (!over || !onUpdateActivity) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    const activeActivity = activities.find((a) => a.id === activeId);
    if (!activeActivity) return;

    // Case 1: Dropped on a day container (rescheduling)
    if (overId.match(/^\d{4}-\d{2}-\d{2}$/)) {
      if (activeActivity.date !== overId) {
        onUpdateActivity(activeActivity.id, {
          date: overId,
          // When moving to a different day, we might want to clear or adjust startTime
          // to put it at the end, but for now we just change the date.
        });
      }
      return;
    }

    // Case 2: Dropped on another activity (reordering or swapping days)
    const overActivity = activities.find((a) => a.id === overId);
    if (overActivity) {
      if (activeActivity.id !== overActivity.id) {
        // If it's a different day, change the date
        if (activeActivity.date !== overActivity.date) {
          onUpdateActivity(activeActivity.id, {
            date: overActivity.date,
          });
        }
        // Reordering logic: ideally we'd swap startTimes or have an 'order' field.
        // For now, consistent with how rescheduling works.
      }
    }
  };

  const handleDragCancel = () => {
    setActiveActivity(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className='w-full h-full flex flex-col bg-slate-950 relative overflow-hidden'>
        {/* Compact Header */}
        <div className='flex-none bg-slate-900/50 border-b border-white/5 px-3 py-3 md:px-6 md:py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Calendar className='w-4 h-4 md:w-5 md:h-5 text-orange-500' />
              <h2 className='text-sm md:text-lg font-semibold text-white'>
                Schedule
              </h2>
              {!readOnly && (
                <span className='text-xs text-slate-500 inline'>
                  • Drag to reschedule
                </span>
              )}
            </div>

            {totalPages > 1 && (
              <div className='flex items-center gap-1 md:gap-2 bg-slate-800/40 p-1 rounded-xl border border-white/5'>
                <Button
                  onClick={handlePrevious}
                  disabled={currentPage === 1}
                  variant='ghost'
                  size='sm'
                  className='h-8 px-2 md:px-3 text-xs md:text-sm text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:text-slate-500'
                >
                  <ChevronLeft className='w-3 h-3 md:w-4 md:h-4' />
                  <span className='hidden sm:inline ml-1'>Prev</span>
                </Button>
                <div className='w-[1px] h-4 bg-white/10 mx-1 md:mx-2'></div>
                <span className='text-xs md:text-sm font-bold text-slate-200 min-w-[2.5rem] text-center'>
                  {currentPage}{" "}
                  <span className='text-slate-500 font-medium'>
                    / {totalPages}
                  </span>
                </span>
                <div className='w-[1px] h-4 bg-white/10 mx-1 md:mx-2'></div>
                <Button
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                  variant='ghost'
                  size='sm'
                  className='h-8 px-2 md:px-3 text-xs md:text-sm text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:text-slate-500'
                >
                  <span className='hidden sm:inline mr-1'>Next</span>
                  <ChevronRight className='w-3 h-3 md:w-4 md:h-4' />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className='flex-1 overflow-y-auto px-4 py-4 md:px-6 space-y-4 md:space-y-6'>
          {days.map((date) => {
            const dateKey = date.toISOString().split("T")[0];
            const dayActivities = activities
              .filter((a) => {
                const actDate = new Date(a.date);
                return (
                  actDate.getFullYear() === date.getFullYear() &&
                  actDate.getMonth() === date.getMonth() &&
                  actDate.getDate() === date.getDate()
                );
              })
              .sort((a, b) => {
                if (!a.startTime && !b.startTime) return 0;
                if (!a.startTime) return 1;
                if (!b.startTime) return -1;
                return a.startTime.localeCompare(b.startTime);
              });

            const isToday = date.toDateString() === new Date().toDateString();
            const isCollapsed = collapsedDays.has(dateKey);
            const hasActivities = dayActivities.length > 0;

            return (
              <div
                key={dateKey}
                className='bg-slate-900/30 rounded-xl md:rounded-2xl border border-white/5 overflow-hidden'
              >
                {/* Day Header */}
                <button
                  onClick={() => toggleDayCollapse(dateKey)}
                  className='w-full flex items-center justify-between px-3 py-3 md:px-4 md:py-4 bg-slate-900/50 hover:bg-slate-900/70 transition-colors'
                >
                  <div className='flex items-center gap-3'>
                    {/* Date Badge */}
                    <div
                      className={`flex flex-col items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-lg md:rounded-xl ${
                        isToday
                          ? "bg-orange-500/20 border-2 border-orange-500/50"
                          : "bg-slate-800/50 border border-white/10"
                      }`}
                    >
                      <span className='text-[10px] md:text-xs text-slate-400 font-medium uppercase'>
                        {date.toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      <span
                        className={`text-lg md:text-xl font-bold ${
                          isToday ? "text-orange-500" : "text-white"
                        }`}
                      >
                        {date.getDate()}
                      </span>
                    </div>

                    {/* Day Info */}
                    <div className='flex flex-col items-start'>
                      <span className='text-sm md:text-base font-semibold text-white'>
                        {date.toLocaleDateString("en-US", { weekday: "long" })}
                      </span>
                      <span className='text-xs md:text-sm text-slate-400'>
                        {dayActivities.length}{" "}
                        {dayActivities.length === 1 ? "activity" : "activities"}
                      </span>
                    </div>
                  </div>

                  {/* Collapse Toggle */}
                  {hasActivities && (
                    <div className='text-slate-500'>
                      {isCollapsed ? (
                        <ChevronDown className='w-5 h-5' />
                      ) : (
                        <ChevronUp className='w-5 h-5' />
                      )}
                    </div>
                  )}
                </button>

                {/* Activities List - Droppable Zone */}
                {!isCollapsed && (
                  <DroppableDay
                    id={dateKey}
                    dayActivities={dayActivities}
                    readOnly={readOnly}
                  >
                    {dayActivities.map((activity) => (
                      <DraggableActivity
                        key={activity.id}
                        activity={activity}
                        onToggleDone={onToggleDone}
                        onEditActivity={onEditActivity}
                        onDeleteActivity={onDeleteActivity}
                        readOnly={readOnly}
                        isExpanded={expandedActivities.has(activity.id)}
                        onToggleExpand={() =>
                          toggleActivityExpansion(activity.id)
                        }
                        onViewActivity={onViewActivity}
                      />
                    )) || []}
                  </DroppableDay>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Drag Overlay with Portal fix */}
      {typeof document !== "undefined" &&
        createPortal(
          <DragOverlay modifiers={[restrictToWindowEdges]} dropAnimation={null}>
            <ActivityDragOverlay activity={activeActivity} />
          </DragOverlay>,
          document.body,
        )}
    </DndContext>
  );
};

export default TravelSchedule;
