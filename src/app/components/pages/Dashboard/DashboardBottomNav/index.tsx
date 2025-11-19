import { LayoutDashboard, Calendar, Building2, User } from "lucide-react";

interface IDashboardBottomNavProps {
  activeTab: "dashboard" | "trips" | "groups" | "profile";
  onTabChange: (tab: "dashboard" | "trips" | "groups" | "profile") => void;
}

const DashboardBottomNav = ({
  activeTab,
  onTabChange,
}: IDashboardBottomNavProps) => {
  return (
    <div
      className='fixed bottom-0 left-0 right-0 z-[9999] px-4'
      style={{
        paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px) + 1rem)",
      }}
    >
      <div
        className='relative bg-white dark:bg-slate-800 rounded-3xl w-full sm:w-fit sm:mx-auto'
        style={{
          paddingTop: "0.5rem",
          paddingBottom: "0.75rem",
          minHeight: "fit-content",
          boxShadow:
            "0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1), 0 -2px 4px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div className='px-4 sm:px-4'>
          <div className='flex items-center justify-center gap-6 sm:gap-8 sm:justify-start'>
            <button
              onClick={() => onTabChange("dashboard")}
              className={`relative flex flex-col items-center justify-center gap-0.5 pt-2.5 pb-3 sm:pt-1.5 sm:pb-2 px-4 sm:px-3 text-xs font-medium transition-colors cursor-pointer ${
                activeTab === "dashboard"
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"
              }`}
            >
              <LayoutDashboard className='w-5 h-5' />
              <span className='hidden sm:inline'>Dashboard</span>
              {activeTab === "dashboard" && (
                <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 dark:bg-orange-400' />
              )}
            </button>
            <button
              onClick={() => onTabChange("trips")}
              className={`relative flex flex-col items-center justify-center gap-0.5 pt-2.5 pb-3 sm:pt-1.5 sm:pb-2 px-4 sm:px-3 text-xs font-medium transition-colors cursor-pointer ${
                activeTab === "trips"
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"
              }`}
            >
              <Calendar className='w-5 h-5' />
              <span className='hidden sm:inline'>Trips</span>
              {activeTab === "trips" && (
                <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 dark:bg-orange-400' />
              )}
            </button>
            <button
              onClick={() => onTabChange("groups")}
              className={`relative flex flex-col items-center justify-center gap-0.5 pt-2.5 pb-3 sm:pt-1.5 sm:pb-2 px-4 sm:px-3 text-xs font-medium transition-colors cursor-pointer ${
                activeTab === "groups"
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"
              }`}
            >
              <Building2 className='w-5 h-5' />
              <span className='hidden sm:inline'>Groups</span>
              {activeTab === "groups" && (
                <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 dark:bg-orange-400' />
              )}
            </button>
            <button
              onClick={() => onTabChange("profile")}
              className={`relative flex flex-col items-center justify-center gap-0.5 pt-2.5 pb-3 sm:pt-1.5 sm:pb-2 px-4 sm:px-3 text-xs font-medium transition-colors cursor-pointer ${
                activeTab === "profile"
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"
              }`}
            >
              <User className='w-5 h-5' />
              <span className='hidden sm:inline'>Profile</span>
              {activeTab === "profile" && (
                <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 dark:bg-orange-400' />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardBottomNav;
