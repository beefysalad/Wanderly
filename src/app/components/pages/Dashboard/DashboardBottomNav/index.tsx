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
              onClick={() => onTabChange("dashboard")}
              className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 pt-2.5 pb-3 sm:pt-1.5 sm:pb-2 px-3 sm:px-2 text-xs font-medium transition-colors cursor-pointer ${
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
              className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 pt-2.5 pb-3 sm:pt-1.5 sm:pb-2 px-3 sm:px-2 text-xs font-medium transition-colors cursor-pointer ${
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
              className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 pt-2.5 pb-3 sm:pt-1.5 sm:pb-2 px-3 sm:px-2 text-xs font-medium transition-colors cursor-pointer ${
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
              className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 pt-2.5 pb-3 sm:pt-1.5 sm:pb-2 px-3 sm:px-2 text-xs font-medium transition-colors cursor-pointer ${
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
