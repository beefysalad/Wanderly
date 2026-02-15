import { Home, Calendar, Building2, User } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

const DashboardBottomNav = () => {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { id: "home", label: "Home", icon: Home, path: "/dashboard" },
    { id: "trips", label: "Trips", icon: Calendar, path: "/trips" },
    { id: "groups", label: "Groups", icon: Building2, path: "/groups" },
    { id: "profile", label: "Profile", icon: User, path: "/profile" },
  ];

  return (
    <div className='fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-auto max-w-[90vw]'>
      {/* Navigation container */}
      <div className='bg-slate-900/80 backdrop-blur-xl rounded-full border border-white/10 shadow-lg shadow-black/50 px-6 py-3'>
        <nav className='flex items-center gap-2 sm:gap-4'>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname?.startsWith(item.path);

            return (
              <button
                key={item.id}
                onClick={() => router.push(item.path)}
                className={`relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-all duration-300 group ${
                  active
                    ? "text-orange-500 bg-orange-500/10 shadow-[0_0_20px_rgba(249,115,22,0.2)]"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon
                  className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 ${
                    active ? "scale-110" : "group-hover:scale-110"
                  }`}
                />

                {/* Active Indicator Dot */}
                {active && (
                  <span className='absolute -bottom-1 w-1 h-1 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.8)]'></span>
                )}

                {/* Tooltip-style label for desktop/tablet */}
                <span className='absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-slate-800 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap border border-white/10 shadow-lg hidden sm:block'>
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
