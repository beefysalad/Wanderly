import { LayoutDashboard, Calendar, Building2, User } from "lucide-react";
import { motion } from "framer-motion";

interface IDashboardBottomNavProps {
  activeTab: "dashboard" | "trips" | "groups" | "profile";
  onTabChange: (tab: "dashboard" | "trips" | "groups" | "profile") => void;
}

const DashboardBottomNav = ({
  activeTab,
  onTabChange,
}: IDashboardBottomNavProps) => {
  const navItems = [
    { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
    { id: "trips" as const, label: "Trips", icon: Calendar },
    { id: "groups" as const, label: "Groups", icon: Building2 },
    { id: "profile" as const, label: "Profile", icon: User },
  ];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999]"
      style={{
        paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))",
      }}
    >
      {/* Backdrop blur overlay */}
      <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/50" />
      
      {/* Navigation container */}
      <div className="relative px-2 sm:px-4 py-2">
        <nav className="flex items-center justify-around sm:justify-center sm:gap-6 max-w-2xl mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className="relative flex flex-col items-center justify-center gap-1 px-3 sm:px-6 py-2 rounded-xl transition-all duration-200 ease-out group"
              >
                {/* Active pill background */}
                {isActive && (
                  <motion.div
                    layoutId="activePill"
                    className="absolute inset-0 bg-orange-100 dark:bg-orange-900/30 rounded-xl"
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}

                {/* Icon */}
                <div className="relative z-10">
                  <Icon
                    className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-200 ${
                      isActive
                        ? "text-orange-600 dark:text-orange-400 scale-110"
                        : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                    }`}
                  />
                </div>

                {/* Label - always visible */}
                <span
                  className={`relative z-10 text-[10px] sm:text-xs font-medium transition-colors duration-200 ${
                    isActive
                      ? "text-orange-600 dark:text-orange-400"
                      : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default DashboardBottomNav;
