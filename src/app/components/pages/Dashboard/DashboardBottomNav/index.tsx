import { LayoutDashboard, Calendar, Users, User } from "lucide-react";

interface IDashboardBottomNavProps {
  activeTab: "dashboard" | "trips" | "groups" | "profile";
  onTabChange: (tab: "dashboard" | "trips" | "groups" | "profile") => void;
}

const DashboardBottomNav = ({
  activeTab,
  onTabChange,
}: IDashboardBottomNavProps) => {
  return (
    <div className='fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 z-50'>
      <div className='max-w-2xl mx-auto px-4'>
        <div className='flex items-center justify-around'>
          <button
            onClick={() => onTabChange("dashboard")}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-4 px-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "dashboard"
                ? "text-orange-600 dark:text-orange-400 border-orange-600 dark:border-orange-400"
                : "text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-slate-300"
            }`}
          >
            <LayoutDashboard className='w-6 h-6' />
            <span className='hidden sm:inline'>Dashboard</span>
          </button>
          <button
            onClick={() => onTabChange("trips")}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-4 px-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "trips"
                ? "text-orange-600 dark:text-orange-400 border-orange-600 dark:border-orange-400"
                : "text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-slate-300"
            }`}
          >
            <Calendar className='w-6 h-6' />
            <span className='hidden sm:inline'>Trips</span>
          </button>
          <button
            onClick={() => onTabChange("groups")}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-4 px-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "groups"
                ? "text-orange-600 dark:text-orange-400 border-orange-600 dark:border-orange-400"
                : "text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-slate-300"
            }`}
          >
            <Users className='w-6 h-6' />
            <span className='hidden sm:inline'>Groups</span>
          </button>
          <button
            onClick={() => onTabChange("profile")}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-4 px-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "profile"
                ? "text-orange-600 dark:text-orange-400 border-orange-600 dark:border-orange-400"
                : "text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-slate-300"
            }`}
          >
            <User className='w-6 h-6' />
            <span className='hidden sm:inline'>Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardBottomNav;
