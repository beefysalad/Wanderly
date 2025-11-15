import { Calendar, ClipboardList } from "lucide-react";

interface IBottomNavProps {
  activeTab: "calendar" | "schedule";
  onTabChange: (tab: "calendar" | "schedule") => void;
}
const BottomNav = ({ activeTab, onTabChange }: IBottomNavProps) => {
  return (
    <div className='fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700'>
      <div className='max-w-2xl mx-auto px-4'>
        <div className='flex items-center justify-around'>
          <button
            onClick={() => onTabChange("calendar")}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-4 px-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "calendar"
                ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
                : "text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-slate-300"
            }`}
          >
            <Calendar className='w-6 h-6' />
            <span className='hidden sm:inline'>Calendar</span>
          </button>
          <button
            onClick={() => onTabChange("schedule")}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-4 px-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "schedule"
                ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
                : "text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-slate-300"
            }`}
          >
            <ClipboardList className='w-6 h-6' />
            <span className='hidden sm:inline'>Schedule</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
