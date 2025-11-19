import { Calendar, ClipboardList } from "lucide-react";
import { motion } from "framer-motion";

interface IBottomNavProps {
  activeTab: "calendar" | "schedule";
  onTabChange: (tab: "calendar" | "schedule") => void;
}
const BottomNav = ({ activeTab, onTabChange }: IBottomNavProps) => {
  return (
    <div
      className='fixed bottom-0 left-0 right-0 z-[9999] px-4'
      style={{
        paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px) + 1rem)",
      }}
    >
      <motion.div
        layout
        className='group relative bg-white dark:bg-slate-800 rounded-3xl w-full sm:w-fit sm:mx-auto'
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        style={{
          paddingTop: "0.5rem",
          paddingBottom: "0.5rem",
          minHeight: "fit-content",
          boxShadow:
            "0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1), 0 -2px 4px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div className='px-4 sm:px-3'>
          <div className='flex items-center justify-center gap-6 sm:gap-8 sm:justify-start'>
            <button
              onClick={() => onTabChange("calendar")}
              className={`relative flex flex-col items-center justify-center py-2.5 sm:py-1.5 px-4 sm:px-3 text-xs font-medium transition-colors duration-200 cursor-pointer ${
                activeTab === "calendar"
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"
              }`}
            >
              <Calendar className='w-5 h-5 transition-transform duration-300 ease-in-out group-hover:scale-110' />
              <span className='hidden sm:inline-block sm:opacity-0 sm:max-w-0 sm:h-0 sm:group-hover:opacity-100 sm:group-hover:max-w-[100px] sm:group-hover:h-auto sm:group-hover:mt-0.5 overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap text-center'>
                Calendar
              </span>
              {activeTab === "calendar" && (
                <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 dark:bg-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
              )}
            </button>
            <button
              onClick={() => onTabChange("schedule")}
              className={`relative flex flex-col items-center justify-center py-2.5 sm:py-1.5 px-4 sm:px-3 text-xs font-medium transition-colors duration-200 cursor-pointer ${
                activeTab === "schedule"
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"
              }`}
            >
              <ClipboardList className='w-5 h-5 transition-transform duration-300 ease-in-out group-hover:scale-110' />
              <span className='hidden sm:inline-block sm:opacity-0 sm:max-w-0 sm:h-0 sm:group-hover:opacity-100 sm:group-hover:max-w-[100px] sm:group-hover:h-auto sm:group-hover:mt-0.5 overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap text-center'>
                Schedule
              </span>
              {activeTab === "schedule" && (
                <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 dark:bg-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BottomNav;
