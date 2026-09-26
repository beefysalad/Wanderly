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
  updateActivity: (id: string, updates: Partial<Activity>) => void;
  toggleDone: (id: string) => void;
  handleViewActivity: (activity: Activity) => void;
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
}: TripTabContentProps) => {
  const addHref = (date: Date) => `/group/${groupId}/trip/${tripId}/activities/add?date=${dayKey(date)}`;

  if (activeTab === "expenses") return <ExpensesComponent groupId={groupId} tripId={tripId} />;
  if (activeTab === "budget") return <BudgetComponent groupId={groupId} tripId={tripId} />;

  if (activeTab === "calendar") {
    return <TripCalendarView startDate={startDate} endDate={endDate} activities={activities} onPickDay={onPickDay} />;
  }

  if (activeTab === "schedule") {
    return (
      <TimelineView
        startDate={startDate}
        endDate={endDate}
        activities={activities}
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
