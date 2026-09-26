import type { Activity } from "@/src/shared/types";
import BudgetComponent from "../../Budget";
import ExpensesComponent from "../../Expenses";
import { dayKey } from "../tripView";
import type { TabType } from "../tripTabs";
import { DayView } from "./DayView";
import { TimelineView } from "./TimelineView";
import { TripCalendarView } from "./TripCalendarView";

interface TripTabContentProps {
  activeTab: TabType;
  groupId: string;
  tripId: string;
  startDate: Date;
  endDate: Date;
  activities: Activity[];
  /** The day the Day tab opens on (0-based); set by tapping a day in the Calendar tab. */
  dayIndex: number;
  onPickDay: (tripDay: number) => void;
  /** Omit both for a read-only guest view. */
  updateActivity?: (id: string, updates: Partial<Activity>) => void;
  toggleDone?: (id: string) => void;
  handleViewActivity: (activity: Activity) => void;
  /** Someone peeking in with a group code: no adding, ticking, dragging or budget. */
  guest?: boolean;
}

export const TripTabContent = ({
  activeTab,
  groupId,
  tripId,
  startDate,
  endDate,
  activities,
  dayIndex,
  onPickDay,
  updateActivity,
  toggleDone,
  handleViewActivity,
  guest = false,
}: TripTabContentProps) => {
  const addHref = guest ? undefined : (date: Date) => `/group/${groupId}/trip/${tripId}/activities/add?date=${dayKey(date)}`;

  if (activeTab === "expenses") return <ExpensesComponent groupId={groupId} tripId={tripId} guest={guest} />;
  if (activeTab === "budget" && !guest) return <BudgetComponent groupId={groupId} tripId={tripId} />;

  if (activeTab === "calendar") {
    return <TripCalendarView startDate={startDate} endDate={endDate} activities={activities} onPickDay={onPickDay} />;
  }

  if (activeTab === "schedule") {
    return (
      <TimelineView
        startDate={startDate}
        endDate={endDate}
        activities={activities}
        readOnly={guest}
        onViewActivity={handleViewActivity}
        onToggleDone={toggleDone}
        onUpdateActivity={updateActivity}
        addHref={addHref}
      />
    );
  }

  return (
    <DayView
      startDate={startDate}
      endDate={endDate}
      activities={activities}
      initialDay={dayIndex}
      onViewActivity={handleViewActivity}
      onToggleDone={toggleDone}
      addHref={addHref}
    />
  );
};
