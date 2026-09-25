import { useRouter } from "next/navigation";
import type { Activity } from "@/src/shared/types";
import BudgetComponent from "../../Budget";
import ExpensesComponent from "../../Expenses";
import TravelCalendar from "../TravelCalendar";
import TravelDayOverview from "../TravelDayOverview";
import TravelSchedule from "../TravelSchedule";
import type { TabType } from "../tripTabs";

interface ITripTabContentProps {
  activeTab: TabType;
  groupId: string;
  tripId: string;
  tripName: string;
  startDate: Date;
  endDate: Date;
  activities: Activity[];
  addActivity: () => void;
  updateActivity: (id: string, updates: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;
  toggleDone: (id: string) => void;
  handleEditActivity: (activity: Activity) => void;
  handleViewActivity: (activity: Activity) => void;
}

export const TripTabContent = ({
  activeTab,
  groupId,
  tripId,
  tripName,
  startDate,
  endDate,
  activities,
  addActivity,
  updateActivity,
  deleteActivity,
  toggleDone,
  handleEditActivity,
  handleViewActivity,
}: ITripTabContentProps) => {
  const router = useRouter();

  return (
  activeTab === "calendar" ? (
        <TravelCalendar
          startDate={startDate}
          endDate={endDate}
          activities={activities}
          onAddActivity={addActivity}
          onUpdateActivity={updateActivity}
          onDeleteActivity={deleteActivity}
          onToggleDone={toggleDone}
          onEditActivity={handleEditActivity}
          onViewActivity={handleViewActivity}
          onOpenAddModal={(date) => {
            const dateStr = date ? date.toISOString().split("T")[0] : "";
            router.push(
              `/group/${groupId}/trip/${tripId}/activities/add${dateStr ? `?date=${dateStr}` : ""}`,
            );
          }}
        />
      ) : activeTab === "expenses" ? (
        <ExpensesComponent
          groupId={groupId}
          tripId={tripId}
          isEmbedded={true}
        />
      ) : activeTab === "budget" ? (
        <BudgetComponent
          groupId={groupId}
          tripId={tripId}
          isEmbedded={true}
        />
      ) : activeTab === "daily" ? (
        <TravelDayOverview
          startDate={startDate}
          endDate={endDate}
          activities={activities}
          onAddActivity={addActivity}
          onUpdateActivity={updateActivity}
          onDeleteActivity={deleteActivity}
          onToggleDone={toggleDone}
          onEditActivity={handleEditActivity}
          onViewActivity={handleViewActivity}
        />
      ) : (
        <TravelSchedule
          startDate={startDate}
          endDate={endDate}
          activities={activities}
          onAddActivity={addActivity}
          onUpdateActivity={updateActivity}
          onDeleteActivity={deleteActivity}
          onToggleDone={toggleDone}
          onEditActivity={handleEditActivity}
          onViewActivity={handleViewActivity}
          tripName={tripName}
        />
      )
  );
};
