import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import type { TabType } from "../tripTabs";

interface IAddFabProps {
  activeTab: TabType;
  groupId: string;
  tripId: string;
}

export const AddFab = ({ activeTab, groupId, tripId }: IAddFabProps) => {
  const router = useRouter();

  return (
    <div className='fixed bottom-24 right-6 z-50 flex flex-col gap-3'>
      <button
        onClick={() =>
          activeTab === "expenses"
            ? router.push(`/group/${groupId}/expenses/add?tripId=${tripId}`)
            : activeTab === "budget"
              ? router.push(`/group/${groupId}/trip/${tripId}/budget/add`)
              : router.push(
                  `/group/${groupId}/trip/${tripId}/activities/add`,
                )
        }
        className='group flex items-center justify-center w-14 h-14 bg-orange-500 hover:bg-orange-400 text-white rounded-full shadow-lg transition-all hover:scale-105 active:scale-95'
        title={
          activeTab === "expenses"
            ? "Add Expense"
            : activeTab === "budget"
              ? "Add Budget"
              : "Add Activity"
        }
      >
        <Plus className='w-7 h-7 transition-transform group-hover:rotate-90' />
        <span className='sr-only'>
          {activeTab === "expenses"
            ? "Add Expense"
            : activeTab === "budget"
              ? "Add Budget"
              : "Add Activity"}
        </span>
      </button>
    </div>
  );
};
