import { Calendar, ClipboardList } from "lucide-react";

interface IBottomNavProps {
  activeTab: "calendar" | "schedule";
  onTabChange: (tab: "calendar" | "schedule") => void;
}
const BottomNav = ({ activeTab, onTabChange }: IBottomNavProps) => {
  return (
    <div className='fixed bottom-0 left-0 right-0 z-[9999] px-4 pb-4'>
      {/* Blur overlay for the gap area */}
      <div
        className='absolute bottom-0 left-4 right-4 backdrop-blur-lg bg-white/30 dark:bg-slate-800/30'
        style={{
          height: "1rem",
          borderBottomLeftRadius: "0.75rem",
          borderBottomRightRadius: "0.75rem",
        }}
      />
      {/* Backdrop extension to cover area when browser UI hides */}
      <div
        className='absolute top-full left-4 right-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-b-3xl'
        style={{
          height: "max(150px, env(safe-area-inset-bottom, 0px) + 150px)",
        }}
      />
      <div
        className='relative bg-white dark:bg-slate-800 rounded-3xl'
        style={{
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
          boxShadow:
            "0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1), 0 -2px 4px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div className='max-w-xl mx-auto px-4 sm:px-2'>
          <div className='flex items-center justify-around'>
            <button
              onClick={() => onTabChange("calendar")}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 sm:py-1.5 px-3 sm:px-2 text-xs font-medium transition-colors border-b-2 ${
                activeTab === "calendar"
                  ? "text-orange-600 dark:text-orange-400 border-orange-600 dark:border-orange-400"
                  : "text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-slate-300"
              }`}
            >
              <Calendar className='w-5 h-5' />
              <span className='hidden sm:inline'>Calendar</span>
            </button>
            <button
              onClick={() => onTabChange("schedule")}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 sm:py-1.5 px-3 sm:px-2 text-xs font-medium transition-colors border-b-2 ${
                activeTab === "schedule"
                  ? "text-orange-600 dark:text-orange-400 border-orange-600 dark:border-orange-400"
                  : "text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-slate-300"
              }`}
            >
              <ClipboardList className='w-5 h-5' />
              <span className='hidden sm:inline'>Schedule</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
